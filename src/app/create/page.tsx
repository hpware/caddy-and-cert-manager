"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-col items-center justify-center">
      <h1>Create Certificate</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmit.mutate(formData);
        }}
        className="flex flex-col items-center justify-center"
      >
        <input type="hidden" name="mode" value="generate" />

        <label htmlFor="Days">Certificate Validity (Days):</label>
        <input
          type="number"
          id="Days"
          name="Days"
          defaultValue="365"
          required
        />

        <label htmlFor="CN">CN (Common Name):</label>
        <input type="text" id="CN" name="CN" required />

        <label htmlFor="OU">OU (Organizational Unit):</label>
        <input type="text" id="OU" name="OU" />

        <label htmlFor="O">O (Organization Name):</label>
        <input type="text" id="O" name="O" />

        <label htmlFor="L">L (Locality):</label>
        <input type="text" id="L" name="L" />

        <label htmlFor="ST">ST (State):</label>
        <input type="text" id="ST" name="ST" />

        <label htmlFor="C">C (Country):</label>
        <input type="text" id="C" name="C" />

        <button type="submit" disabled={handleSubmit.isPending}>
          Create
        </button>
      </form>
    </div>
  );
}
