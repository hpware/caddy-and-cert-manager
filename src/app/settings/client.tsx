"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KeyRound } from "lucide-react";
import { type User } from "better-auth";
import { useQuery } from "@tanstack/react-query";

export default function Page({
  providerId,
  userEmail,
  isAdmin,
}: {
  providerId: string;
  userEmail: string;
  isAdmin: boolean;
}) {
  return (
    <div>
      <div className="m-3 flex flex-col items-start gap-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <span>
          Logged in as {userEmail} via{" "}
          {providerId === "credential" ? "password auth" : "SSO"}
        </span>
        {isAdmin ? <AdminTextComponent /> : null}
      </div>
      <div>
        {providerId === "credential" ? (
          <Dialog>
            <DialogTrigger>
              <Button className="cursor-pointer hover:bg-accent group transition-all duration-300">
                Change Password{" "}
                <KeyRound className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="flex flex-row text-center items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Change your password
              </DialogTitle>
              <div className="flex flex-col">
                <form className="space-x-3 space-y-2">
                  <div>
                    <label>Current Password</label>
                    <Input type="password" />
                  </div>

                  <div>
                    <label>New Password</label>
                    <Input type="password" />
                  </div>

                  <div>
                    <label>Repeat your new Password</label>
                    <Input type="password" />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Submit</Button>
                  </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
        <Button></Button>
      </div>
    </div>
  );
}

{
  /**Add is admin checks */
}

function AdminTextComponent() {
  const fetchSystemInfo = useQuery({
    queryKey: ["systemInfo"],
    queryFn: async () => {
      const res = await fetch("/api/admin/system_info");
      if (!res.ok) {
        throw new Error("Failed to fetch system info");
      }
      return res.json();
    },
  });
  if (!fetchSystemInfo.data) {
    return (
      <span>
        Server running with Next.js version 0.0.0 and CertManager 0.0.0
      </span>
    );
  }
  return (
    <span>
      Server running with Next.js version{" "}
      {fetchSystemInfo.data.data.nextjsVersion} and CertManager{" "}
      {fetchSystemInfo.data.data.ccmVerion}
    </span>
  );
}
