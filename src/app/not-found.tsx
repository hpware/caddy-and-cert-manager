import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 Page Not Found",
};

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center absolute inset-0">
      <span className="text-4xl md:text-8xl text-bold">404</span>
      <span>Whoops! This page cannot be found!</span>
      <a href="/">
        <Button className="group mt-3">
          Go Home{" "}
          <HomeIcon className="w-6 h-6 group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
        </Button>
      </a>
    </div>
  );
}
