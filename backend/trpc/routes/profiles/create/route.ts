import { protectedProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { db } from "@/backend/db/users";
import { TRPCError } from "@trpc/server";

export const createProfileProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1),
      birthYear: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const user = await db.users.findById(ctx.userId);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Benutzer nicht gefunden",
      });
    }

    const currentProfiles = await db.profiles.findByUserId(ctx.userId);
    const isPremium = user.subscriptionTier === "premium";
    const maxProfiles = isPremium ? 10 : 1;

    if (currentProfiles.length >= maxProfiles) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Du kannst maximal ${maxProfiles} Profile erstellen. Upgrade auf Premium für bis zu 10 Profile.`,
      });
    }

    const profile = await db.profiles.create(ctx.userId, input.name, input.birthYear);
    return profile;
  });
