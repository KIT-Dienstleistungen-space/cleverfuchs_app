import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import verifyReceiptRoute from "./routes/subscription/verify/route";
import webhookRoute from "./routes/subscription/webhook/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  subscription: createTRPCRouter({
    verifyReceipt: verifyReceiptRoute,
    webhook: webhookRoute,
  }),
});

export type AppRouter = typeof appRouter;
