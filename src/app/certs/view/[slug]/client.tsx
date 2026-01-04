"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Client({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center text-center justify-center absolute inset-0">
      <h1 className="text-2xl">Download Certificate</h1>
      <div>
        <h2>Private Key</h2>
        <div className="flex flex-row gap-2">
          <Link href={`/api/certs/get_file/${slug}?type=private&get=download`}>
            <Button>Download</Button>
          </Link>
          <Link href={`/api/certs/get_file/${slug}?type=private`}>
            <Button>View</Button>
          </Link>
        </div>
      </div>
      <div>
        <h2>Public Key</h2>
        <div className="flex flex-row gap-2">
          <Link href={`/api/certs/get_file/${slug}?type=public&get=download`}>
            <Button>Download</Button>
          </Link>
          <Link href={`/api/certs/get_file/${slug}?type=public`}>
            <Button>View</Button>
          </Link>
        </div>
        <div>
          <h2>Public Key (Full Chain)</h2>
          <div className="flex flex-row gap-2">
            <Link
              href={`/api/certs/get_file/${slug}?type=public_fullchain&get=download`}
            >
              <Button>Download</Button>
            </Link>
            <Link href={`/api/certs/get_file/${slug}?type=public_fullchain`}>
              <Button>View</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
