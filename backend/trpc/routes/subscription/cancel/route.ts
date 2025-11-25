import { protectedProcedure } from "@/backend/trpc/create-context";
import { db } from "@/backend/db/users";
import { TRPCError } from "@trpc/server";

export const cancelSubscriptionProcedure = protectedProcedure.mutation(async ({ ctx }) => {
  const user = await db.users.findById(ctx.userId);
  
  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Benutzer nicht gefunden",
    });
  }

  await db.users.update(ctx.userId, {
    subscriptionTier: "free",
    subscriptionExpiresAt: undefined,
  });

  const purchases = await db.purchases.findByUserId(ctx.userId);
  for (const purchase of purchases) {
    if (purchase.status === "active") {
      await db.purchases.updateStatus(purchase.id, "cancelled");
    }
  }

  return {
    success: true,
    message: "Abo erfolgreich gekündigt",
  };
});
