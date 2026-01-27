import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "./drizzle/db"; // your drizzle instance
import { kvData } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const checkIfSetupCompleted = await db
          .select()
          .from(kvData)
          .where(eq(kvData.key, "setup-completed"))
          .execute();
        if (checkIfSetupCompleted[0].value === true) {
          throw new APIError("BAD_REQUEST", {
            message: "Setup already completed",
          });
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        if (ctx.context.returned?.status !== undefined) {
          return;
        }
        await db
          .update(kvData)
          .set({ value: true })
          .where(eq(kvData.key, "setup-completed"))
          .execute();
      }
    }),
  },
});
