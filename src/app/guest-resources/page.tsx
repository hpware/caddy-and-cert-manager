"use client";

import { Button } from "@/components/ui/button";
import { LogInIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <a href="/api/certs/master?get=download">
          <Button>Download Master Certificate</Button>
        </a>
      </div>
    </div>
  );
}
