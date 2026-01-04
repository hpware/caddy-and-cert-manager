"use client";
import { Button } from "@/components/ui/button";
import { ArrowRightCircleIcon, KeySquare } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/components/core/authClient";

export default function Page() {
  const signInAction = async () => {
    await authClient.signIn.sso({
      providerId: "sso",
      callbackURL: "/",
    });
  };
  return (
    <div className="flex flex-col items-center justify-center absolute inset-0">
      <h1 className="text-2xl font-bold text-left">Login</h1>
      <Button
        className="group"
        onClick={() => {
          signInAction();
        }}
      >
        Login via SSO
        <ArrowRightCircleIcon className="w-6 h-6 group-hover:-rotate-10 group-hover:scale-110 transition-all duration-300" />
      </Button>
    </div>
  );
}
