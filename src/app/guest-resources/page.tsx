"use client";

import { Button } from "@/components/ui/button";
import { LogInIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-row pb-2">
          <Link href="/auth/login" className="group">
            <LogInIcon className="w-6 h-6 text-primary group-hover:text-accent group-hover:-rotate-10 group-hover:scale-110 transition-all duration-300" />
          </Link>
        </div>
        <a href="/api/certs/master?get=download">
          <Button>Download Master Certificate</Button>
        </a>
      </div>
    </div>
  );
}
