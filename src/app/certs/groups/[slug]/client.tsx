"use client";

import * as schema from "@/components/drizzle/schema";

export default function Client({
  dbData,
}: {
  dbData: typeof schema.certificates.$inferSelect;
}) {
  return (
    <div className="flex flex-col items-center text-center justify-center absolute inset-0">
      {/*TBD */}
    </div>
  );
}
