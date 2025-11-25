import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { db } from "@/backend/db/users";
import { TRPCError } from "@trpc/server";

export const verifyPurchaseProcedure = protectedProcedure
  .input(
    z.object({
      productId: z.string(),
      transactionId: z.string().optional(),
      purchaseDate: z.number(),
      platform: z.enum(["ios", "android", "web"]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const user = await db.users.findById(ctx.userId);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Benutzer nicht gefunden",
      });
    }

    const activePurchase = await db.purchases.findActivePurchase(
      ctx.userId,
      input.productId
    );

    if (activePurchase) {
      return {
        success: true,
        alreadyActive: true,
        purchase: activePurchase,
      };
    }

    const purchaseId =
      Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const expiryDate = Date.now() + 30 * 24 * 60 * 60 * 1000;

    await db.purchases.create({
      id: purchaseId,
      userId: ctx.userId,
      productId: input.productId,
      purchaseDate: input.purchaseDate,
      expiryDate,
      transactionId: input.transactionId,
      platform: input.platform,
      status: "active",
    });

    await db.users.update(ctx.userId, {
      subscriptionTier: "premium",
      subscriptionExpiresAt: expiryDate,
    });

    return {
      success: true,
      alreadyActive: false,
      expiresAt: expiryDate,
    };
  });
