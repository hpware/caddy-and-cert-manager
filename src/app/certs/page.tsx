"use client";
import { useQuery } from "@tanstack/react-query";
import { Highlight, themes } from "prism-react-renderer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogPortal,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BadgeInfoIcon,
  BadgePlusIcon,
  ClipboardIcon,
  Download,
  FileBadgeIcon,
  PenLine,
  XIcon,
} from "lucide-react";

export default function Page() {
  const [openMasterCertView, setOpenMasterCertView] = useState(false);
  const getMasterCert = useQuery({
    queryFn: async () => {
      try {
        const response = await fetch("/api/certs/master");
        if (!response.ok) {
          throw new Error("Failed to fetch master certificate");
        }
        return await response.text();
      } catch (e) {
        toast.error("Failed to fetch master certificate");
        return null;
      }
    },
    queryKey: ["masterCert"],
  });
  const router = useRouter();
  const handleSubmitCreate = useMutation({
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
          router.push(`/certs/view/${res.uuidSavePath}`);
        },
        {
          success: "Certificate created successfully!",
          error: "Failed to create certificate",
        },
      );
    },
  });
  const handleSubmitCSR = useMutation({
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
          router.push(`/certs/view/${res.uuidSavePath}`);
        },
        {
          success: "Certificate created successfully!",
          error: "Failed to create certificate",
        },
      );
    },
  });
  const dialogStuff = [
    {
      icon: BadgePlusIcon,
      title: "Make Certificate",
      description:
        "Please provide the necessary information to make a certificate request.",
      reactLogic: (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmitCreate.mutate(formData);
          }}
          className="space-y-2"
        >
          <Input type="hidden" name="mode" value="generate" />

          <Label htmlFor="Days">Certificate Validity (Days):</Label>
          <Input
            type="number"
            id="Days"
            name="Days"
            defaultValue="365"
            required
          />

          <Label htmlFor="CN">CN (Common Name):</Label>
          <Input type="text" id="CN" name="CN" required />

          <Label htmlFor="OU">OU (Organizational Unit):</Label>
          <Input type="text" id="OU" name="OU" />

          <Label htmlFor="O">O (Organization Name):</Label>
          <Input type="text" id="O" name="O" />

          <Label htmlFor="L">L (Locality):</Label>
          <Input type="text" id="L" name="L" />

          <Label htmlFor="ST">ST (State):</Label>
          <Input type="text" id="ST" name="ST" />

          <Label htmlFor="C">C (Country):</Label>
          <Input type="text" id="C" name="C" />

          <DialogFooter>
            <Button
              onClick={() => {}}
              className="group mt-3"
              disabled={handleSubmitCreate.isPending}
              type="submit"
            >
              Sign{" "}
              <PenLine className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
            </Button>
          </DialogFooter>
        </form>
      ),
    },
    {
      icon: BadgeInfoIcon,
      title: "Request Certificate",
      description:
        "Please provide the necessary information to make a certificate request.",
      reactLogic: (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmitCSR.mutate(formData);
          }}
          className="space-y-2"
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

          <DialogFooter>
            <Button
              onClick={() => {}}
              className="group mt-3"
              disabled={handleSubmitCSR.isPending}
              type="submit"
            >
              Sign{" "}
              <PenLine className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
            </Button>
          </DialogFooter>
        </form>
      ),
    },
    {
      icon: FileBadgeIcon,
      title: "Master Certificate",
      description: "Create a new master certificate",
      reactLogic: (
        <>
          {getMasterCert.data && (
            <div className="mt-4 rounded-lg overflow-hidden border border-border">
              <Highlight
                theme={themes.nightOwl}
                code={getMasterCert.data}
                language="text"
              >
                {({
                  className,
                  style,
                  tokens,
                  getLineProps,
                  getTokenProps,
                }) => (
                  <pre
                    className="p-4 text-xs max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-all"
                    style={{ ...style, margin: 0 }}
                  >
                    {tokens.map((line, i) => (
                      <div
                        key={i}
                        {...getLineProps({ line })}
                        className="table-row"
                      >
                        <span className="table-cell text-zinc-500 select-none pr-4 text-right min-w-[2rem]">
                          {i + 1}
                        </span>
                        <span className="table-cell">
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </span>
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(getMasterCert.data || "");
                toast.success("Copied to clipboard!");
              }}
              className="group"
            >
              Copy{" "}
              <ClipboardIcon className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
            </Button>
            <a href="/api/certs/master?get=download">
              <Button className="group">
                Download{" "}
                <Download className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
              </Button>
            </a>
          </DialogFooter>
        </>
      ),
    },
  ];
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen w-full">
        <h1 className="text-2xl font-bold pb-2">Certificate Manager</h1>
        <div className="grid grid-flow-col auto-cols-fr gap-4 justify-center">
          {dialogStuff.map((i) => (
            <Dialog key={i.title}>
              <DialogTrigger>
                <div className="relative flex flex-col items-center justify-center border p-4 rounded group transition-all duration-300 cursor-pointer">
                  <i.icon className="w-6 h-6 text-primary group-hover:text-accent group-hover:-rotate-10 group-hover:scale-110 transition-all duration-300" />
                  <div className="text-xl font-bold whitespace-nowrap">
                    {i.title}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{i.title}</DialogTitle>
                  <DialogDescription>{i.description}</DialogDescription>
                </DialogHeader>
                {i.reactLogic}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </>
  );
}
