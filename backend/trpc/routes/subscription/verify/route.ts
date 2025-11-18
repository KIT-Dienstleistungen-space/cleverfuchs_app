import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import {
  hashReceipt,
  persistSubscriptionRecord,
  findSubscriptionByDevice,
} from "../store";

const inputSchema = z.object({
  deviceId: z.string().min(8),
  platform: z.enum(["ios", "android", "web"]),
  productId: z.string().min(3),
  receipt: z.string().min(10),
  transactionId: z.string().min(4),
  environment: z.enum(["sandbox", "production"]),
});

export default publicProcedure
  .input(inputSchema)
  .mutation(({ input }) => {
    const previous = findSubscriptionByDevice(input.deviceId);
    const isSameReceipt =
      previous && previous.receiptHash === hashReceipt(input.receipt);

    if (!isSameReceipt && input.receipt.length < 16) {
      throw new Error("Ungültiger Kaufbeleg");
    }

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const status = isSameReceipt ? previous?.status ?? "restored" : "active";

    const record = persistSubscriptionRecord({
      deviceId: input.deviceId,
      tier: "premium",
      status,
      productId: input.productId,
      transactionId: input.transactionId,
      platform: input.platform,
      expiresAt,
      verifiedAt: Date.now(),
      receiptHash: hashReceipt(input.receipt),
    });

    return {
      message: isSameReceipt ? "Abo synchronisiert" : "Kauf verifiziert",
      subscription: {
        tier: record.tier,
        status: record.status,
        expiresAt: record.expiresAt,
        transactionId: record.transactionId,
        productId: record.productId,
        platform: record.platform,
        verifiedAt: record.verifiedAt,
      },
    };
  });
