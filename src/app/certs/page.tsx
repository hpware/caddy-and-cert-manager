import Client from "./client";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certificates | Home Core",
};

export default function Page() {
  return <Client />;
}
