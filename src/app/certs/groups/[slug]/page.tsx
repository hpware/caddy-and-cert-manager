import { db } from "@/components/drizzle/db";
import Client from "./client";
import type { Metadata } from "next";
import { certificates } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Certificate View | Home Core",
};

const uuidV4Re =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  if (!uuidV4Re.test(slug)) {
    notFound();
  }
  const dbData = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, slug));
  if (dbData.length === 0) {
    notFound();
  }
  return <Client dbData={dbData[0]} />;
}
