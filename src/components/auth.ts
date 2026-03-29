import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "./drizzle/db"; // your drizzle instance
import { kvData } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { apiKey, genericOAuth } from "better-auth/plugins";
export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_URL,
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    ...(process.env.NEXT_PUBLIC_SSO_ENABLE?.toLowerCase() === "true"
      ? [
          genericOAuth({
            config: [
              {
                providerId: "sso",
                clientId: String(process.env.SSO_CLIENT_ID),
                clientSecret: process.env.SSO_CLIENT_SECRET,
                discoveryUrl: process.env.SSO_DISCOVERY_URL,
              },
            ],
          }),
        ]
      : []),
    apiKey(),
  ],
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
        if ((ctx.context.returned as any)?.status !== undefined) {
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
