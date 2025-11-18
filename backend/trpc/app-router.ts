import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import chatRoute from "./routes/chat/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  chat: chatRoute,
});

export type AppRouter = typeof appRouter;
