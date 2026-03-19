"use client";

import { certificates } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

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
