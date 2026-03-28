import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { paymentService } from "@/lib/payment-service";
import { useAuth } from "./AuthContext";

export type SubscriptionTier = "free" | "premium";

export interface SubscriptionLimits {
  maxProfiles: number;
  maxMessagesPerDay: number;
  maxImagesPerProfilePerDay: number;
}

export interface UsageStats {
  messagesToday: number;
  imagesUploadedToday: { [profileId: string]: number };
  lastResetDate: string;
}

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt?: number;
}

const SUBSCRIPTION_KEY = "subscription";
const USAGE_STATS_KEY = "usage_stats";

const FREE_LIMITS: SubscriptionLimits = {
  maxProfiles: 1,
  maxMessagesPerDay: 20,
  maxImagesPerProfilePerDay: 5,
};

const PREMIUM_LIMITS: SubscriptionLimits = {
  maxProfiles: 10,
  maxMessagesPerDay: Infinity,
  maxImagesPerProfilePerDay: 20,
};

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>({ tier: "free" });
  const [usageStats, setUsageStats] = useState<UsageStats>({
    messagesToday: 0,
    imagesUploadedToday: {},
    lastResetDate: new Date().toDateString(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const subscriptionStatusQuery = trpc.subscription.status.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 60000 }
  );

  const usageStatsQuery = trpc.user.usage.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );

  const limits = useMemo(
    () => (subscription.tier === "premium" ? PREMIUM_LIMITS : FREE_LIMITS),
    [subscription.tier]
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
    if (subscriptionStatusQuery.data) {
      setSubscription({
        tier: subscriptionStatusQuery.data.tier,
        expiresAt: subscriptionStatusQuery.data.expiresAt,
      });
    }
  }, [subscriptionStatusQuery.data]);

  useEffect(() => {
    if (usageStatsQuery.data) {
      setUsageStats({
        messagesToday: usageStatsQuery.data.messagesToday,
        imagesUploadedToday: usageStatsQuery.data.imagesUploadedToday,
        lastResetDate: new Date().toDateString(),
      });
    }
  }, [usageStatsQuery.data]);

  useEffect(() => {
    if (!subscriptionStatusQuery.isLoading && !usageStatsQuery.isLoading) {
      setIsLoading(false);
    }
  }, [subscriptionStatusQuery.isLoading, usageStatsQuery.isLoading]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subData, usageData] = await Promise.all([
          AsyncStorage.getItem(SUBSCRIPTION_KEY),
          AsyncStorage.getItem(USAGE_STATS_KEY),
        ]);

        if (subData && !isAuthenticated) {
          const parsed: Subscription = JSON.parse(subData);
          if (parsed.tier === "premium" && parsed.expiresAt && parsed.expiresAt < Date.now()) {
            setSubscription({ tier: "free" });
          } else {
            setSubscription(parsed);
          }
        }

        if (usageData && !isAuthenticated) {
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
        if (!isAuthenticated) {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [isAuthenticated]);

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

  const resetDailyUsageIfNeeded = useCallback(() => {
    const today = new Date().toDateString();
    if (usageStats.lastResetDate !== today) {
      setUsageStats({
        messagesToday: 0,
        imagesUploadedToday: {},
        lastResetDate: today,
      });
    }
  }, [usageStats.lastResetDate]);

  useEffect(() => {
    resetDailyUsageIfNeeded();
  }, [resetDailyUsageIfNeeded]);

  const canSendMessage = useCallback((): boolean => {
    resetDailyUsageIfNeeded();
    return usageStats.messagesToday < limits.maxMessagesPerDay;
  }, [usageStats.messagesToday, limits.maxMessagesPerDay, resetDailyUsageIfNeeded]);

  const canUploadImage = useCallback((profileId: string): boolean => {
    resetDailyUsageIfNeeded();
    const profileImages = usageStats.imagesUploadedToday[profileId] || 0;
    return profileImages < limits.maxImagesPerProfilePerDay;
  }, [usageStats.imagesUploadedToday, limits.maxImagesPerProfilePerDay, resetDailyUsageIfNeeded]);

  const canCreateProfile = useCallback((currentProfileCount: number): boolean => {
    return currentProfileCount < limits.maxProfiles;
  }, [limits.maxProfiles]);

  const incrementMessageCount = useCallback(() => {
    resetDailyUsageIfNeeded();
    setUsageStats((prev) => ({
      ...prev,
      messagesToday: prev.messagesToday + 1,
    }));
  }, [resetDailyUsageIfNeeded]);

  const incrementImageCount = useCallback((profileId: string) => {
    resetDailyUsageIfNeeded();
    setUsageStats((prev) => ({
      ...prev,
      imagesUploadedToday: {
        ...prev.imagesUploadedToday,
        [profileId]: (prev.imagesUploadedToday[profileId] || 0) + 1,
      },
    }));
  }, [resetDailyUsageIfNeeded]);

  const upgradeToPremium = useCallback(async () => {
    try {
      setIsPurchasing(true);
      await paymentService.initializePurchases();
      const result = await paymentService.purchasePremium();

      if (result.success) {
        await subscriptionStatusQuery.refetch();
        await usageStatsQuery.refetch();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error("Upgrade error:", error);
      return { success: false, error: error.message || "Upgrade fehlgeschlagen" };
    } finally {
      setIsPurchasing(false);
    }
  }, [subscriptionStatusQuery, usageStatsQuery]);

  const cancelPremium = useCallback(async () => {
    try {
      const success = await paymentService.cancelSubscription();
      if (success) {
        await subscriptionStatusQuery.refetch();
        setSubscription({ tier: "free" });
      }
      return success;
    } catch (error) {
      console.error("Cancel error:", error);
      return false;
    }
  }, [subscriptionStatusQuery]);

  const getRemainingMessages = useCallback((): number => {
    resetDailyUsageIfNeeded();
    if (limits.maxMessagesPerDay === Infinity) return Infinity;
    return Math.max(0, limits.maxMessagesPerDay - usageStats.messagesToday);
  }, [limits.maxMessagesPerDay, usageStats.messagesToday, resetDailyUsageIfNeeded]);

  const getRemainingImages = useCallback((profileId: string): number => {
    resetDailyUsageIfNeeded();
    const used = usageStats.imagesUploadedToday[profileId] || 0;
    return Math.max(0, limits.maxImagesPerProfilePerDay - used);
  }, [limits.maxImagesPerProfilePerDay, usageStats.imagesUploadedToday, resetDailyUsageIfNeeded]);

  return useMemo(() => ({
    subscription,
    limits,
    usageStats,
    isLoading,
    isPurchasing,
    isPremium: subscription.tier === "premium",
    canSendMessage,
    canUploadImage,
    canCreateProfile,
    incrementMessageCount,
    incrementImageCount,
    upgradeToPremium,
    cancelPremium,
    getRemainingMessages,
    getRemainingImages,
  }), [
    subscription,
    limits,
    usageStats,
    isLoading,
    isPurchasing,
    canSendMessage,
    canUploadImage,
    canCreateProfile,
    incrementMessageCount,
    incrementImageCount,
    upgradeToPremium,
    cancelPremium,
    getRemainingMessages,
    getRemainingImages,
  ]);
});
