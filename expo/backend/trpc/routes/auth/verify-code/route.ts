import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { db } from "@/backend/db/users";
import { TRPCError } from "@trpc/server";

export const verifyAccessCodeProcedure = publicProcedure
  .input(
    z.object({
      accessCode: z.string().length(8),
    })
  )
  .mutation(async ({ input }) => {
    const user = await db.users.findByAccessCode(input.accessCode);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ungültiger Zugangscode",
      });
    }

    return {
      id: user.id,
      name: user.name,
    };
  });
