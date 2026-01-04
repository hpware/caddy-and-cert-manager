import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../drizzle/db"; // your drizzle instance
import { jwt } from "better-auth/plugins";
import { sso } from "@better-auth/sso";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: JSON.parse(process.env.TRUSTED_ORIGINS!),
  user: {
    modelName: "core_users",
  },
  session: {
    modelName: "core_sessions",
  },
  account: {
    modelName: "core_accounts",
  },
  verification: {
    modelName: "core_verifications",
  },
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.SSO_ISSUER!,
        audience: process.env.SSO_ISSUER!,
      },
    }),
    sso({
      defaultSSO: [
        {
          providerId: "sso",
          issuer: process.env.SSO_ISSUER!,
          domain: process.env.SSO_USER_DOMAIN!,
          oidcConfig: {
            clientId: process.env.NEXT_PUBLIC_SSO_CLIENT_ID!,
            clientSecret: process.env.SSO_CLIENT_SECRET!,
            issuer: process.env.SSO_ISSUER!,
            pkce: process.env.SSO_PKCE_STATUS === "false" ? false : true,
            discoveryEndpoint: process.env.SSO_DISCOVERY_ENDPOINT!,
          },
        },
      ],
    }),
  ],
});
