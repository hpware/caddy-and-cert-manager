import Client from "./client";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Web | Home Core",
};

export default function Page() {
  return <Client />;
}
