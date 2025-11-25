import { protectedProcedure } from "@/backend/trpc/create-context";
import { db } from "@/backend/db/users";

export const getProfilesProcedure = protectedProcedure.query(async ({ ctx }) => {
  const profiles = await db.profiles.findByUserId(ctx.userId);
  return profiles;
});
