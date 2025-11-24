import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { db } from "@/backend/db/users";
import { TRPCError } from "@trpc/server";

export const deleteChatProcedure = protectedProcedure
  .input(
    z.object({
      chatId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const chat = db.chats.findById(input.chatId);

    if (!chat) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Chat nicht gefunden",
      });
    }

    if (chat.userId !== ctx.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Zugriff verweigert",
      });
    }

    db.chats.delete(input.chatId);
    return { success: true };
  });
