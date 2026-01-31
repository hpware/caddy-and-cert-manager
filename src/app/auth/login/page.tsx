import Client from "./client";
import { db } from "@/components/drizzle/db";
import { kvData } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function Page() {
  const checkIfSetupCompleted = await db
    .select()
    .from(kvData)
    .where(eq(kvData.key, "setup-completed"))
    .execute();

  if (checkIfSetupCompleted[0].value === true) {
    return <Client />;
  }
  redirect("/auth/register");
}
