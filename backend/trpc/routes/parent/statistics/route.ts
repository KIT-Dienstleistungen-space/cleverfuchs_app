import { protectedProcedure } from "@/backend/trpc/create-context";
import { db } from "@/backend/db/users";

export const getParentStatisticsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const profiles = await db.profiles.findByUserId(ctx.userId);
  const chats = await db.chats.findByUserId(ctx.userId);
  const stats = await db.usageStats.get(ctx.userId);
  
  const profileStats = await Promise.all(
    profiles.map(async (profile) => {
      const profileChats = chats.filter((c) => c.profileId === profile.id);
      let totalMessages = 0;
      
      for (const chat of profileChats) {
        const messages = await db.messages.findByChatId(chat.id);
        totalMessages += messages.length;
      }
      
      return {
        profileId: profile.id,
        profileName: profile.name,
        chatCount: profileChats.length,
        messageCount: totalMessages,
        imagesUploadedToday: stats.imagesUploadedToday[profile.id] || 0,
      };
    })
  );

  return {
    totalProfiles: profiles.length,
    totalChats: chats.length,
    messagesToday: stats.messagesToday,
    profileStats,
  };
});
