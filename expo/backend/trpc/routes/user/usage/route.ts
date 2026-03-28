import { protectedProcedure } from "@/backend/trpc/create-context";
import { db } from "@/backend/db/users";

export const getUsageStatsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const user = await db.users.findById(ctx.userId);
  const stats = await db.usageStats.get(ctx.userId);

  const isPremium = user?.subscriptionTier === "premium";
  const maxMessages = isPremium ? Infinity : 20;
  const maxImagesPerProfile = isPremium ? 20 : 5;

  return {
    messagesToday: stats.messagesToday,
    remainingMessages: isPremium
      ? Infinity
      : Math.max(0, maxMessages - stats.messagesToday),
    maxMessages,
    imagesUploadedToday: stats.imagesUploadedToday,
    maxImagesPerProfile,
    isPremium,
  };
});
