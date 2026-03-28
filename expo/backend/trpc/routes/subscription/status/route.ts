import { protectedProcedure } from "@/backend/trpc/create-context";
import { db } from "@/backend/db/users";

export const getSubscriptionStatusProcedure = protectedProcedure.query(async ({ ctx }) => {
  const user = await db.users.findById(ctx.userId);
  
  if (!user) {
    return {
      tier: "free" as const,
      isActive: false,
    };
  }

  const isPremium = user.subscriptionTier === "premium";
  const now = Date.now();
  const isActive = isPremium && (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > now);

  if (isPremium && user.subscriptionExpiresAt && user.subscriptionExpiresAt <= now) {
    await db.users.update(ctx.userId, {
      subscriptionTier: "free",
      subscriptionExpiresAt: undefined,
    });

    return {
      tier: "free" as const,
      isActive: false,
      expiresAt: user.subscriptionExpiresAt,
    };
  }

  return {
    tier: user.subscriptionTier,
    isActive,
    expiresAt: user.subscriptionExpiresAt,
  };
});
