import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { db } from "@/backend/db/users";
import { TRPCError } from "@trpc/server";

export const registerProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    const existingUser = db.users.findByEmail(input.email);

    if (existingUser) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Ein Benutzer mit dieser E-Mail existiert bereits",
      });
    }

    const user = db.users.create(input.email, input.password, input.name);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      accessCode: user.accessCode,
      subscriptionTier: user.subscriptionTier,
    };
  });
