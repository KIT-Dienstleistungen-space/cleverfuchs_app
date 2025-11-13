import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useMemo } from "react";

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
  const [subscription, setSubscription] = useState<Subscription>({ tier: "free" });
  const [usageStats, setUsageStats] = useState<UsageStats>({
    messagesToday: 0,
    imagesUploadedToday: {},
    lastResetDate: new Date().toDateString(),
  });
  const [isLoading, setIsLoading] = useState(true);

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
    const loadData = async () => {
      try {
        const [subData, usageData] = await Promise.all([
          AsyncStorage.getItem(SUBSCRIPTION_KEY),
          AsyncStorage.getItem(USAGE_STATS_KEY),
        ]);

        if (subData) {
          const parsed: Subscription = JSON.parse(subData);
          if (parsed.tier === "premium" && parsed.expiresAt && parsed.expiresAt < Date.now()) {
            setSubscription({ tier: "free" });
          } else {
            setSubscription(parsed);
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

  const upgradeToPremium = useCallback(() => {
    const oneMonthFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;
    setSubscription({
      tier: "premium",
      expiresAt: oneMonthFromNow,
    });
  }, []);

  const cancelPremium = useCallback(() => {
    setSubscription({ tier: "free" });
  }, []);

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
