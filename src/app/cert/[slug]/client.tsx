"use client";

import Link from "next/link";

export default function Client({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center text-center justify-center absolute inset-0">
      <h1 className="text-2xl">Download Certificate</h1>
      <div>
        <h2>Private Key</h2>
        <div className="flex flex-row gap-2">
          <Link href={`/api/certs/get_file/${slug}?type=private&get=download`}>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Download
            </button>
          </Link>
          <Link href={`/api/certs/get_file/${slug}?type=private`}>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              View
            </button>
          </Link>
        </div>
      </div>
      <div>
        <h2>Public Key</h2>
        <div className="flex flex-row gap-2">
          <Link href={`/api/certs/get_file/${slug}?type=public&get=download`}>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Download
            </button>
          </Link>
          <Link href={`/api/certs/get_file/${slug}?type=public`}>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              View
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
