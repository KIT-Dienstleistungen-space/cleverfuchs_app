import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { updateSubscriptionFromWebhook } from "../store";

const webhookSchema = z.object({
  deviceId: z.string().optional(),
  transactionId: z.string().optional(),
  status: z.enum(["active", "restored", "expired", "canceled", "failed"]),
  expiresAt: z.number().optional(),
});

export default publicProcedure
  .input(webhookSchema)
  .mutation(({ input }) => {
    const updated = updateSubscriptionFromWebhook(input);

    return {
      success: Boolean(updated),
      subscription: updated
        ? {
            tier: updated.tier,
            status: updated.status,
            expiresAt: updated.expiresAt,
            transactionId: updated.transactionId,
            productId: updated.productId,
            platform: updated.platform,
            verifiedAt: updated.verifiedAt,
          }
        : null,
    };
  });
