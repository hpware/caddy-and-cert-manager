"use client";
import { authClient } from "@/components/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileKey } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import projectData from "@/components/projectData";
import { useRouter } from "next/navigation";

export default function Client() {
  const router = useRouter();
  return (
    <div className="justify-center absolute inset-0 flex flex-col mx-auto">
      <div className="flex flex-col md:flex-row border border-border rounded-lg p-3 mx-auto bg-secondary/70 backdrop-blur-md shadow-md">
        <div className="flex flex-col p-5 xs:pb-0 justify-center">
          <FileKey className="w-12 h-12 mb-5" />
          <h1>Register Portal</h1>
          <span className="text-sm text-gray-500 mb-5">
            {projectData.version}
          </span>
          <span className="break text-xs text-muted-foreground">
            By setting up this instance,
            <br />
            you agree to{" "}
            <Link
              href="https://github.com/hpware/caddy-and-cert-manager/blob/master/LICENSE"
              className="underline hover:text-primary transition-all duration-300"
            >
              this project's license
            </Link>
            .
          </span>
        </div>
        <form
          className="flex flex-col space-y-2 gap-2 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            toast.promise(
              async () => {
                const formData = new FormData(e.target as HTMLFormElement);
                const email = formData.get("email") as string;
                const password = formData.get("password") as string;
                const name = formData.get("name") as string;
                const submitUserInfo = await authClient.signUp.email({
                  name,
                  email,
                  password,
                });
                if (submitUserInfo.error) {
                  throw new Error(submitUserInfo.error.message);
                }
                router.push("/");
                return {
                  user: submitUserInfo.data.user.name ?? "unknown user",
                };
              },
              {
                loading: "Registering...",
                success: (last) => `You are logged in as ${last.user}`,
                error: (e) => `Failed Reason: ${e.message}`,
              },
            );
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="Name"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              type="text"
              id="email"
              name="email"
              placeholder="Email"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              required
            />
          </div>
          <Button type="submit">Login</Button>
        </form>
      </div>
    </div>
  );
}
