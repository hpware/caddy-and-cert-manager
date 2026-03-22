import { db } from "@/components/drizzle/db";
import Client from "./client";
import type { Metadata } from "next";
import { certificates } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Certificate View | Home Core",
};
export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const dbData = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, slug));
  if (dbData.length === 0) {
    notFound();
  }
  return <Client dbData={dbData[0]} />;
}
