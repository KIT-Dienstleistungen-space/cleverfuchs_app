import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { db } from "@/backend/db/users";
import { TRPCError } from "@trpc/server";

export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await db.users.findByEmail(input.email);

    if (!user || user.password !== input.password) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Ungültige E-Mail oder Passwort",
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      accessCode: user.accessCode,
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    };
  });
