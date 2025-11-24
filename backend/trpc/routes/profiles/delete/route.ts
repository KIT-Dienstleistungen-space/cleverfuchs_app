import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { db } from "@/backend/db/users";
import { TRPCError } from "@trpc/server";

export const deleteProfileProcedure = protectedProcedure
  .input(
    z.object({
      profileId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const profile = db.profiles.findById(input.profileId);

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Profil nicht gefunden",
      });
    }

    if (profile.userId !== ctx.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Zugriff verweigert",
      });
    }

    const chats = db.chats.findByProfileId(input.profileId);
    chats.forEach((chat) => {
      db.chats.delete(chat.id);
    });

    db.profiles.delete(input.profileId);
    return { success: true };
  });
