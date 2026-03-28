import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { db } from "@/backend/db/users";
import { TRPCError } from "@trpc/server";

export const updateProfileProcedure = protectedProcedure
  .input(
    z.object({
      profileId: z.string(),
      name: z.string().min(1).optional(),
      birthYear: z.string().optional(),
      languageLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const profile = await db.profiles.findById(input.profileId);

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

    const updated = await db.profiles.update(input.profileId, {
      name: input.name,
      birthYear: input.birthYear,
      languageLevel: input.languageLevel,
    });

    return updated;
  });
