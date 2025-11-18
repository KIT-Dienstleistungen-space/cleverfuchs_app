import { SubscriptionLimits, SubscriptionTier } from "@/types/subscription";

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxProfiles: 1,
    maxMessagesPerDay: 20,
    maxImagesPerProfilePerDay: 5,
  },
  premium: {
    maxProfiles: 10,
    maxMessagesPerDay: Infinity,
    maxImagesPerProfilePerDay: 20,
  },
};

export const getLimitsForTier = (tier: SubscriptionTier): SubscriptionLimits =>
  SUBSCRIPTION_LIMITS[tier];
