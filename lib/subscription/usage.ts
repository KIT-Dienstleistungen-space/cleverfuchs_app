import { SubscriptionLimits, UsageStats } from "@/types/subscription";

export const normalizeUsageStats = (
  stats: UsageStats,
  today = new Date().toDateString()
): UsageStats => {
  if (stats.lastResetDate === today) {
    return stats;
  }

  return {
    messagesToday: 0,
    imagesUploadedToday: {},
    lastResetDate: today,
  };
};

export const canSendMessageWithStats = (
  stats: UsageStats,
  limits: SubscriptionLimits
): boolean => {
  if (limits.maxMessagesPerDay === Infinity) {
    return true;
  }
  return stats.messagesToday < limits.maxMessagesPerDay;
};

export const canUploadImageWithStats = (
  stats: UsageStats,
  limits: SubscriptionLimits,
  profileId: string
): boolean => {
  const profileImages = stats.imagesUploadedToday[profileId] || 0;
  return profileImages < limits.maxImagesPerProfilePerDay;
};

export const canCreateProfileWithLimits = (
  limits: SubscriptionLimits,
  currentProfileCount: number
): boolean => currentProfileCount < limits.maxProfiles;

export const incrementMessageUsage = (stats: UsageStats): UsageStats => ({
  ...stats,
  messagesToday: stats.messagesToday + 1,
});

export const incrementImageUsage = (
  stats: UsageStats,
  profileId: string
): UsageStats => ({
  ...stats,
  imagesUploadedToday: {
    ...stats.imagesUploadedToday,
    [profileId]: (stats.imagesUploadedToday[profileId] || 0) + 1,
  },
});

export const getRemainingMessagesFromStats = (
  stats: UsageStats,
  limits: SubscriptionLimits
): number => {
  if (limits.maxMessagesPerDay === Infinity) {
    return Infinity;
  }
  return Math.max(0, limits.maxMessagesPerDay - stats.messagesToday);
};

export const getRemainingImagesFromStats = (
  stats: UsageStats,
  limits: SubscriptionLimits,
  profileId: string
): number => {
  return Math.max(
    0,
    limits.maxImagesPerProfilePerDay - (stats.imagesUploadedToday[profileId] || 0)
  );
};
