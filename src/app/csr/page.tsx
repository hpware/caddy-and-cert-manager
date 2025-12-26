"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();
  const handleSubmit = useMutation({
    mutationFn: async (data: FormData) => {
      toast.promise(
        async () => {
          const req = await fetch("/api/certs/generate", {
            method: "POST",
            body: data,
          });
          const res = await req.json();
          if (!res.ok) {
            throw new Error(res.error || "Failed to generate certificate");
          }
          router.push(`/cert/${res.uuidSavePath}`);
        },
        {
          success: "Certificate created successfully!",
          error: "Failed to create certificate",
        }
      );
    },
  });

  return (
    <div className="flex flex-col items-center text-center justify-center absolute inset-0">
      <h1 className="text-2xl font-bold p-2">Create Certificate</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmit.mutate(formData);
        }}
        className="flex flex-col items-center justify-center space-y-1"
      >
        <Input type="hidden" name="mode" value="csr" />

        <Label htmlFor="Days">Certificate Validity (Days):</Label>
        <Input
          type="number"
          id="Days"
          name="Days"
          defaultValue="365"
          required
        />
        <Label htmlFor="CSR">CSR (Certificate Signing Request):</Label>
        <Input type="file" id="CSR" name="CSR" required />
        <Button type="submit" disabled={handleSubmit.isPending}>
          Create
        </Button>
      </form>
    </div>
  );
}
