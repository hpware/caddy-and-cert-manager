import Client from "./client";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/components/auth";
import { headers } from "next/headers";
import { db } from "@/components/drizzle/db";
import { account } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Settings | Home Core",
};

export default async function Page() {
  const Headers = await headers();
  const userSession = await auth.api.getSession({ headers: Headers });
  if (userSession === null || userSession === undefined) notFound();
  const readDbUserInfo = await db
    .select()
    .from(account)
    .where(eq(account.userId, userSession.user.id));
  return (
    <Client
      providerId={readDbUserInfo[0].providerId}
      userEmail={userSession.user.email}
      isAdmin={userSession.user.role === "admin"}
    />
  );
}
