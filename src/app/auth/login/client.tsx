"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileKey } from "lucide-react";
import { toast } from "sonner";

export default function Client() {
  return (
    <div className="justify-center absolute inset-0 flex flex-col mx-auto">
      <div className="flex md:flex-row border border-border rounded-lg p-3 mx-auto bg-secondary/70 backdrop-blur-md shadow-md">
        <div className="flex flex-col space-y-2 gap-2 p-5">
          <FileKey className="w-12 h-12" />
          <h1>Login Portal</h1>
        </div>
        <form
          className="flex flex-col space-y-2 gap-2 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            toast.promise(
              async () => {
                return {
                  user: "Default User",
                };
              },
              {
                loading: "Logging you in...",
                success: (last) => `You are logged in as ${last.user}`,
                error: (e) => `Failed Reason: ${e.message}`,
              },
            );
          }}
        >
          <Input
            type="text"
            id="username"
            name="username"
            placeholder="Username"
            required
          />
          <Input
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            required
          />
          <Button type="submit">Login</Button>
        </form>
      </div>
    </div>
  );
}
