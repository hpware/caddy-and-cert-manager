import { db } from "@/components/drizzle/db";
import Client from "./client";
import type { Metadata } from "next";
import * as schema from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Certificate View | Home Core",
};
export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const dbData = await db
    .select()
    .from(schema.certificates)
    .where(eq(schema.certificates.id, slug));
  if (dbData.length === 0) {
    return (
      <div className="flex flex-col items-center text-center justify-center absolute inset-0">
        <span>No certificate</span>
      </div>
    );
  }
  return <Client dbData={dbData[0]} />;
}
