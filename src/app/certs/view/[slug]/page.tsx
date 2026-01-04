import Client from "./client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certificate View",
};
export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  return <Client slug={slug} />;
}
