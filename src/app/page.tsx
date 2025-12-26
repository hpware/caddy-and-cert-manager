"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center absolute inset-0">
      <Link href="/create">
        <Button>Create Certificate</Button>
      </Link>
      <div className="justify-center items-center">
        <h1 className="text-2xl font-bold">Master Certificate</h1>
        <div className="flex flex-row gap-2 justify-center text-center">
          <Link href="/api/certs/master?get=download">
            <Button>Download</Button>
          </Link>
          <Link href="/api/certs/master">
            <Button>View</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
