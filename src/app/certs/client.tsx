"use client";
import { useQuery } from "@tanstack/react-query";
import { Highlight, themes } from "prism-react-renderer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo } from "react";
import Table from "@/components/table";
import {
  CalendarSearch,
  CloudSync,
  GlobeIcon,
  KeyRoundIcon,
  Trash,
  Trash2Icon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  const [dialogStatus, setDialogStatus] = useState<string>("easy");
  const [easySync, setEasySync] = useState({
    city: "",
    country: "TW",
    commonName: "",
    organization: "",
    organizationUnit: "",
    locality: "",
    revokable: true,
  });
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
  const queryClient = useQueryClient();
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
  const dialogStuff = [
    {
      icon: BadgePlusIcon,
      title: "Create Certificate",
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
          <Tabs value={dialogStatus} onValueChange={setDialogStatus}>
            <TabsList>
              <TabsTrigger value="easy">Easy</TabsTrigger>
              <TabsTrigger value="csr">CSR</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input type="hidden" name="mode" value={dialogStatus} />

          <Label htmlFor="Days">
            {dialogStatus === "easy"
              ? "How long do you want this certificate to last?"
              : "Certificate Validity (Days):"}
          </Label>
          <Input
            type="number"
            id="Days"
            name="Days"
            defaultValue="365"
            required
          />
          {dialogStatus === "easy" ? (
            <>
              <Label htmlFor="CN">Your Domain or IP Addresses:</Label>
              <Input
                type=""
                id="CN"
                name="CN"
                required
                value={easySync.commonName}
                onChange={(e) => {
                  setEasySync({ ...easySync, commonName: e.target.value });
                }}
              />

              <Label htmlFor="O">Your Organization:</Label>
              <Input
                type="text"
                id="O"
                name="O"
                value={easySync.organization}
                onChange={(e) => {
                  setEasySync({ ...easySync, organization: e.target.value });
                }}
              />
              <Input
                type="text"
                id="OU"
                name="OU"
                value={easySync.organization}
                hidden
              />

              <Label htmlFor="L">Your City or State:</Label>
              {/* ST and L both are the same value and synced! */}
              <Input
                type="text"
                id="L"
                name="L"
                value={easySync.city}
                onChange={(e) => {
                  setEasySync({ ...easySync, city: e.target.value });
                }}
              />
              <Input
                type="text"
                id="ST"
                name="ST"
                value={easySync.city}
                hidden
              />

              {/** 選擇國家，限制兩位英文 */}
              <Label htmlFor="C">Your Country's Code (Ex: US, UK, TW):</Label>
              <Input
                type="text"
                id="C"
                name="C"
                value={easySync.country}
                onChange={(e) => {
                  if (e.target.value.length <= 2) {
                    setEasySync({
                      ...easySync,
                      country: e.target.value.toUpperCase(),
                    });
                  }
                }}
              />
              <input
                type="checkbox"
                id="revokable"
                name="revokable"
                hidden
                value={1}
              />
            </>
          ) : dialogStatus === "advanced" ? (
            <>
              <Label htmlFor="CN">CN (Common Name):</Label>
              <Input
                type="text"
                id="CN"
                name="CN"
                required
                value={easySync.commonName}
                onChange={(e) => {
                  setEasySync({
                    ...easySync,
                    commonName: e.target.value,
                  });
                }}
              />

              <Label htmlFor="O">O (Organization Name):</Label>
              <Input
                type="text"
                id="O"
                name="O"
                value={easySync.organization}
                onChange={(e) => {
                  setEasySync({ ...easySync, organization: e.target.value });
                }}
              />

              <Label htmlFor="OU">OU (Organizational Unit):</Label>
              <Input
                type="text"
                id="OU"
                name="OU"
                value={easySync.organizationUnit}
                onChange={(e) => {
                  setEasySync({
                    ...easySync,
                    organizationUnit: e.target.value,
                  });
                }}
              />

              <Label htmlFor="L">L (Locality):</Label>
              <Input
                type="text"
                id="L"
                name="L"
                value={easySync.locality}
                onChange={(e) => {
                  setEasySync({ ...easySync, locality: e.target.value });
                }}
              />

              <Label htmlFor="ST">ST (State):</Label>
              <Input
                type="text"
                id="ST"
                name="ST"
                value={easySync.city} // STOP!!! FUCK STOP CHANGING IT TO STATE
                onChange={(e) => {
                  setEasySync({ ...easySync, city: e.target.value }); // don't fucking change it to state Zed autocompelete!!!!
                }}
              />

              <Label htmlFor="C">C (Country):</Label>
              <Input
                type="text"
                id="C"
                name="C"
                value={easySync.country}
                onChange={(e) => {
                  if (e.target.value.length <= 2) {
                    setEasySync({
                      ...easySync,
                      country: e.target.value.toUpperCase(),
                    });
                  }
                }}
              />

              <div className="flex items-center space-x-3">
                <Label htmlFor="revokable">Revokable</Label>
                <input
                  type="checkbox"
                  id="revokable"
                  name="revokable"
                  value={easySync.revokable ? 1 : 0}
                  onChange={(e) =>
                    setEasySync({ ...easySync, revokable: e.target.checked })
                  }
                />
              </div>
            </>
          ) : dialogStatus === "csr" ? (
            <>
              <Label htmlFor="CSR">CSR (Certificate Signing Request):</Label>
              <Input type="file" id="CSR" name="CSR" required />
              <input
                type="checkbox"
                id="revokable"
                name="revokable"
                hidden
                value={1}
              />
            </>
          ) : null}

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
  const getAllCerts = useInfiniteQuery({
    queryKey: ["getAllCerts"],
    queryFn: async ({ pageParam }: { pageParam: any }) => {
      const req = await fetch(`/api/certs/get_all_certs?offset=${pageParam}`);
      return await req.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextOffset,
  });

  const memoedData = useMemo(() => {
    return getAllCerts.data?.pages.flatMap((i) => i.data);
  }, [getAllCerts]);

  const invalidateQuery = () =>
    queryClient.invalidateQueries({ queryKey: ["getAllCerts"] });

  const deleteCert = useMutation({
    mutationFn: async (data: any) => {
      toast.promise(
        async () => {
          const req = await fetch("/api/certs", {
            method: "DELETE",
            body: JSON.stringify({
              id: data,
            }),
          });
          if (!req.ok) {
            throw new Error(await req.text());
          }
          invalidateQuery();
        },
        {
          loading: "Deleting...",
          success: "Deleted!",
          error: (e) => `Error deleting certificate: ${e.message}`,
        },
      );
    },
  });
  return (
    <div className="m-3">
      <h1 className="text-2xl font-bold">Certificate Manager</h1>
      <div className="flex flex-col md:flex-row justify-between pb-2">
        <div></div>
        <div className="auto-cols-fr gap-4 justify-center">
          {dialogStuff.map((i) => (
            <Dialog key={i.title}>
              <DialogTrigger>
                <Button className="cursor-pointer hover:bg-accent group transition-all duration-300">
                  {i.title}{" "}
                  <i.icon className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
                </Button>
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
          <Button
            className="cursor-pointer hover:bg-accent group transition-all duration-300"
            onClick={() => {
              invalidateQuery();
              toast.success("Data refreshed!");
            }}
          >
            Refresh{" "}
            <CloudSync className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
          </Button>
        </div>
      </div>
      <Table
        columns={[
          {
            accessorKey: "name",
            header: () => (
              <div className="flex items-center gap-1">
                <GlobeIcon className="w-4 h-4" /> Name
              </div>
            ),
            cell: ({ row }) => <span>{row.getValue("name")}</span>,
          },
          {
            accessorKey: "created_at",
            header: () => (
              <div className="flex items-center gap-2">
                <CalendarSearch className="w-4 h-4" /> Created At
              </div>
            ),
            cell: ({ row }) => (
              <span>
                {new Date(row.getValue("created_at")).toLocaleString("zh-tw")}
              </span>
            ),
          },
          {
            accessorKey: "privateKey",
            header: () => (
              <div className="flex items-center gap-2">
                <KeyRoundIcon className="w-4 h-4" /> is CSR?
              </div>
            ),
            cell: ({ row }) => (
              <span className={row.getValue("privateKey") ? "text-bold" : ""}>
                {row.getValue("privateKey") ? "No" : "Yes"}
              </span>
            ),
          },
          {
            accessorKey: "id",
            header: () => <span></span>,
            cell: ({ row }) => (
              <div className="flex flex-row justify-center space-y-1">
                <Link href={`/certs/view/${row.getValue("id")}`}>
                  <Button className="group">
                    取得憑證{" "}
                    <FileBadgeIcon className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
                  </Button>
                </Link>
                <Button
                  className="group"
                  onClick={() => {
                    deleteCert.mutate(row.original.id);
                  }}
                >
                  Delete{" "}
                  <Trash2Icon className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
                </Button>
              </div>
            ),
          },
        ]}
        data={memoedData || []}
      />
      <div className="flex justify-center pt-3">
        {getAllCerts.isFetchingNextPage ? (
          <Button disabled>Loading...</Button>
        ) : (
          <Button
            onClick={() => {
              getAllCerts.fetchNextPage();
            }}
          >
            Index More
          </Button>
        )}
      </div>
    </div>
  );
}
