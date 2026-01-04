import { ssoClient } from "@better-auth/sso/client";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_CORE_URL!,
  plugins: [ssoClient()],
});
