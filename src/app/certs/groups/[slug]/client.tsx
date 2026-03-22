"use client";

import { certificates } from "@/components/drizzle/schema";

export default function Client({
  dbData,
}: {
  dbData: typeof certificates.$inferSelect;
}) {
  return (
    <div className="flex flex-col items-center text-center justify-center absolute inset-0">
      {/*TBD */}
    </div>
  );
}
