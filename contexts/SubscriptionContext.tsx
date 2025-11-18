import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  SubscriptionInfo,
  SubscriptionTier,
  UsageStats,
} from "@/types/subscription";
import { getLimitsForTier } from "@/lib/subscription/limits";
import {
  canCreateProfileWithLimits,
  canSendMessageWithStats,
  canUploadImageWithStats,
  getRemainingImagesFromStats,
  getRemainingMessagesFromStats,
  incrementImageUsage,
  incrementMessageUsage,
  normalizeUsageStats,
} from "@/lib/subscription/usage";
import {
  subscriptionPurchaseService,
  type NormalizedPurchase,
} from "@/lib/subscription/iap";

const SUBSCRIPTION_KEY = "subscription";
const USAGE_STATS_KEY = "usage_stats";

type AsyncState = "idle" | "pending" | "success" | "failed";

interface SubscriptionApiState {
  purchase: AsyncState;
  restore: AsyncState;
  verification: AsyncState;
  lastMessage?: string;
  lastError?: string;
}

const defaultSubscription: SubscriptionInfo = {
  tier: "free",
  status: "inactive",
};

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscription, setSubscription] = useState<SubscriptionInfo>(
    defaultSubscription
  );
  const [usageStats, setUsageStats] = useState<UsageStats>({
    messagesToday: 0,
    imagesUploadedToday: {},
    lastResetDate: new Date().toDateString(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [iapState, setIapState] = useState<SubscriptionApiState>({
    purchase: "idle",
    restore: "idle",
    verification: "idle",
  });

  const hasActiveSubscription =
    subscription.tier === "premium" &&
    (subscription.status === "active" || subscription.status === "restored") &&
    (!subscription.expiresAt || subscription.expiresAt > Date.now());

  const tierForLimits: SubscriptionTier = hasActiveSubscription
    ? "premium"
    : "free";

  const limits = useMemo(
    () => getLimitsForTier(tierForLimits),
    [tierForLimits]
  );

  const saveSubscription = useCallback(async () => {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
    } catch (error) {
      console.error("Error saving subscription:", error);
    }
  }, [subscription]);

  const saveUsageStats = useCallback(async () => {
    try {
      await AsyncStorage.setItem(USAGE_STATS_KEY, JSON.stringify(usageStats));
    } catch (error) {
      console.error("Error saving usage stats:", error);
    }
  }, [usageStats]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subData, usageData] = await Promise.all([
          AsyncStorage.getItem(SUBSCRIPTION_KEY),
          AsyncStorage.getItem(USAGE_STATS_KEY),
        ]);

        if (subData) {
          const parsed: SubscriptionInfo = JSON.parse(subData);
          const status: SubscriptionInfo["status"] = parsed.status
            ? parsed.status
            : parsed.tier === "premium"
            ? "active"
            : "inactive";
          const nextValue: SubscriptionInfo = {
            ...parsed,
            status,
          };
          if (
            nextValue.tier === "premium" &&
            nextValue.expiresAt &&
            nextValue.expiresAt < Date.now()
          ) {
            setSubscription({
              tier: "free",
              status: "expired",
              expiresAt: nextValue.expiresAt,
            });
          } else {
            setSubscription(nextValue);
          }
        }

        if (usageData) {
          const parsed: UsageStats = JSON.parse(usageData);
          const today = new Date().toDateString();
          
          if (parsed.lastResetDate !== today) {
            setUsageStats({
              messagesToday: 0,
              imagesUploadedToday: {},
              lastResetDate: today,
            });
          } else {
            setUsageStats(parsed);
          }
        }
      } catch (error) {
        console.error("Error loading subscription data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveSubscription();
    }
  }, [subscription, isLoading, saveSubscription]);

  useEffect(() => {
    if (!isLoading) {
      saveUsageStats();
    }
  }, [usageStats, isLoading, saveUsageStats]);

  const ensureFreshUsageStats = useCallback((): UsageStats => {
    const normalized = normalizeUsageStats(usageStats);
    if (normalized !== usageStats) {
      setUsageStats(normalized);
      return normalized;
    }
    return usageStats;
  }, [usageStats]);

  useEffect(() => {
    setUsageStats((prev) => normalizeUsageStats(prev));
  }, []);

  const canSendMessage = useCallback((): boolean => {
    const fresh = ensureFreshUsageStats();
    return canSendMessageWithStats(fresh, limits);
  }, [ensureFreshUsageStats, limits]);

  const canUploadImage = useCallback((profileId: string): boolean => {
    const fresh = ensureFreshUsageStats();
    return canUploadImageWithStats(fresh, limits, profileId);
  }, [ensureFreshUsageStats, limits]);

  const canCreateProfile = useCallback((currentProfileCount: number): boolean => {
    return canCreateProfileWithLimits(limits, currentProfileCount);
  }, [limits.maxProfiles]);

  const incrementMessageCount = useCallback(() => {
    setUsageStats((prev) => incrementMessageUsage(normalizeUsageStats(prev)));
  }, []);

  const incrementImageCount = useCallback((profileId: string) => {
    setUsageStats((prev) => incrementImageUsage(normalizeUsageStats(prev), profileId));
  }, []);

  const handleVerification = useCallback(
    async (purchase: NormalizedPurchase, mode: "purchase" | "restore") => {
      setIapState((prev) => ({
        ...prev,
        verification: "pending",
        lastError: undefined,
      }));

      try {
        const response = await subscriptionPurchaseService.verifyPurchaseWithBackend(
          purchase
        );
        const verified = response.subscription ?? defaultSubscription;
        setSubscription({
          ...verified,
          status: verified.status ?? (mode === "restore" ? "restored" : "active"),
        });
        setIapState((prev) => ({
          ...prev,
          verification: "success",
          lastMessage:
            mode === "restore"
              ? "Abo wiederhergestellt"
              : response.message || "Abo verifiziert",
        }));
      } catch (error) {
        setSubscription({ tier: "free", status: "failed" });
        setIapState((prev) => ({
          ...prev,
          verification: "failed",
          lastError: error instanceof Error ? error.message : String(error),
        }));
        throw error;
      }
    },
    []
  );

  const purchaseSubscription = useCallback(async () => {
    setIapState((prev) => ({
      ...prev,
      purchase: "pending",
      lastError: undefined,
      lastMessage: "Kauf wird gestartet...",
    }));
    try {
      const purchase = await subscriptionPurchaseService.purchaseSubscription();
      setSubscription((prev) => ({
        ...prev,
        tier: "premium",
        status: "pending",
      }));
      setIapState((prev) => ({
        ...prev,
        purchase: "success",
        lastMessage: "Beleg empfangen",
      }));
      await handleVerification(purchase, "purchase");
    } catch (error) {
      setSubscription({ tier: "free", status: "failed" });
      setIapState((prev) => ({
        ...prev,
        purchase: "failed",
        lastError: error instanceof Error ? error.message : String(error),
      }));
      throw error;
    }
  }, [handleVerification]);

  const restoreSubscription = useCallback(async () => {
    setIapState((prev) => ({
      ...prev,
      restore: "pending",
      lastError: undefined,
      lastMessage: "Prüfe Käufe...",
    }));
    try {
      const purchases = await subscriptionPurchaseService.restorePurchases();
      if (purchases.length === 0) {
        setIapState((prev) => ({
          ...prev,
          restore: "success",
          lastMessage: "Keine Käufe gefunden",
        }));
        return;
      }
      await handleVerification(purchases[0], "restore");
      setIapState((prev) => ({
        ...prev,
        restore: "success",
        lastMessage: "Kauf wiederhergestellt",
      }));
    } catch (error) {
      setIapState((prev) => ({
        ...prev,
        restore: "failed",
        lastError: error instanceof Error ? error.message : String(error),
      }));
      throw error;
    }
  }, [handleVerification]);

  useEffect(() => {
    let cancelled = false;

    const bootstrapPurchases = async () => {
      try {
        await subscriptionPurchaseService.initialize();
        if (cancelled) return;
        setIapState((prev) => ({
          ...prev,
          restore: prev.restore === "idle" ? "pending" : prev.restore,
        }));
        const purchases = await subscriptionPurchaseService.restorePurchases();
        if (cancelled) return;
        if (purchases.length > 0) {
          await handleVerification(purchases[0], "restore");
          if (cancelled) return;
          setIapState((prev) => ({
            ...prev,
            restore: "success",
          }));
        } else {
          setIapState((prev) => ({
            ...prev,
            restore: "success",
          }));
        }
      } catch (error) {
        if (cancelled) return;
        setIapState((prev) => ({
          ...prev,
          restore: prev.restore === "idle" ? "failed" : prev.restore,
          lastError: error instanceof Error ? error.message : String(error),
        }));
      }
    };

    bootstrapPurchases();

    return () => {
      cancelled = true;
      subscriptionPurchaseService.disconnect();
    };
  }, [handleVerification]);

  const getRemainingMessages = useCallback((): number => {
    const fresh = ensureFreshUsageStats();
    return getRemainingMessagesFromStats(fresh, limits);
  }, [ensureFreshUsageStats, limits]);

  const getRemainingImages = useCallback((profileId: string): number => {
    const fresh = ensureFreshUsageStats();
    return getRemainingImagesFromStats(fresh, limits, profileId);
  }, [ensureFreshUsageStats, limits]);

  useEffect(() => {
    if (
      subscription.tier === "premium" &&
      subscription.expiresAt &&
      subscription.expiresAt < Date.now()
    ) {
      setSubscription({
        tier: "free",
        status: "expired",
        expiresAt: subscription.expiresAt,
      });
    }
  }, [subscription]);

  return useMemo(() => ({
    subscription,
    limits,
    usageStats,
    isLoading,
    isPremium: hasActiveSubscription,
    iapState,
    canSendMessage,
    canUploadImage,
    canCreateProfile,
    incrementMessageCount,
    incrementImageCount,
    purchaseSubscription,
    restoreSubscription,
    getRemainingMessages,
    getRemainingImages,
  }), [
    subscription,
    limits,
    usageStats,
    isLoading,
    hasActiveSubscription,
    iapState,
    canSendMessage,
    canUploadImage,
    canCreateProfile,
    incrementMessageCount,
    incrementImageCount,
    purchaseSubscription,
    restoreSubscription,
    getRemainingMessages,
    getRemainingImages,
  ]);
});
