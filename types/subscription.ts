export type SubscriptionTier = "free" | "premium";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "restored"
  | "pending"
  | "failed"
  | "expired"
  | "canceled";

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  expiresAt?: number;
  status: SubscriptionStatus;
  transactionId?: string;
  productId?: string;
  platform?: "ios" | "android" | "web";
  verifiedAt?: number;
}

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
