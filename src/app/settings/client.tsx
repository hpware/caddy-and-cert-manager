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

export default function Page({
  providerId,
  userEmail,
}: {
  providerId: string;
  userEmail: string;
}) {
  return (
    <div>
      <div className="m-3">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <div>
        {providerId}
        <br />
        {userEmail}
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
        <Button></Button>
      </div>
    </div>
  );
}

{
  /**Add is admin checks */
}
