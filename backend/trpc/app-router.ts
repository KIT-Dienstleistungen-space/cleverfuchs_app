import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { registerProcedure } from "./routes/auth/register/route";
import { loginProcedure } from "./routes/auth/login/route";
import { verifyAccessCodeProcedure } from "./routes/auth/verify-code/route";
import { createProfileProcedure } from "./routes/profiles/create/route";
import { getProfilesProcedure } from "./routes/profiles/list/route";
import { updateProfileProcedure } from "./routes/profiles/update/route";
import { deleteProfileProcedure } from "./routes/profiles/delete/route";
import { createChatProcedure } from "./routes/chats/create/route";
import { getChatsProcedure } from "./routes/chats/list/route";
import { getMessagesProcedure } from "./routes/chats/messages/route";
import { deleteChatProcedure } from "./routes/chats/delete/route";
import { chatProcedure } from "./routes/chat/send/route";
import { getUsageStatsProcedure } from "./routes/user/usage/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    register: registerProcedure,
    login: loginProcedure,
    verifyAccessCode: verifyAccessCodeProcedure,
  }),
  profiles: createTRPCRouter({
    create: createProfileProcedure,
    list: getProfilesProcedure,
    update: updateProfileProcedure,
    delete: deleteProfileProcedure,
  }),
  chats: createTRPCRouter({
    create: createChatProcedure,
    list: getChatsProcedure,
    messages: getMessagesProcedure,
    delete: deleteChatProcedure,
  }),
  chat: createTRPCRouter({
    send: chatProcedure,
  }),
  user: createTRPCRouter({
    usage: getUsageStatsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
