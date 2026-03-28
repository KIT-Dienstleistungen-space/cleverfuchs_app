import { protectedProcedure } from "@/backend/trpc/create-context";
import { db } from "@/backend/db/users";

export const getAllChatsForParentProcedure = protectedProcedure.query(async ({ ctx }) => {
  const chats = await db.chats.findByUserId(ctx.userId);
  
  const chatsWithDetails = await Promise.all(
    chats.map(async (chat) => {
      const profile = await db.profiles.findById(chat.profileId);
      const messages = await db.messages.findByChatId(chat.id);
      const lastMessage = messages[messages.length - 1];
      
      return {
        ...chat,
        profileName: profile?.name || "Unbekannt",
        messageCount: messages.length,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              timestamp: lastMessage.timestamp,
              role: lastMessage.role,
            }
          : null,
      };
    })
  );

  return chatsWithDetails;
});
