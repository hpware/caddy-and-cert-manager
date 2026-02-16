"use client";
import { FormEvent, useMemo, useState } from "react";
import Table from "@/components/table";
import { Button } from "@/components/ui/button";
import {
  CalendarSearch,
  CloudSync,
  GlobeIcon,
  PlusCircle,
  ServerIcon,
  ShieldIcon,
  Trash2Icon,
  FileIcon,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";

export default function Client() {
  const [currentTabStatus, setCurrentTabStatus] = useState<string>("proxy");
  const [sslCertType, setSslCertType] = useState<string>("homecert");
  const [currentAddServiceOpenPanel, setCurrentAddServiceOpenPanel] =
    useState<boolean>(false);

  const queryClient = useQueryClient();

  const getAllServices = useInfiniteQuery({
    queryKey: ["getAllServices"],
    queryFn: async ({ pageParam }: { pageParam: any }) => {
      const req = await fetch(`/api/web/get_all?offset=${pageParam}`);
      return await req.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const memoedData = useMemo(() => {
    return getAllServices.data?.pages.flatMap((i) => i.data ?? []).filter(Boolean) || [];
  }, [getAllServices.data]);

  const invalidateQuery = () =>
    queryClient.invalidateQueries({ queryKey: ["getAllServices"] });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      toast.promise(
        async () => {
          const req = await fetch("/api/web/delete", {
            method: "DELETE",
            body: JSON.stringify({ id }),
          });
          const res = await req.json();
          if (!res.ok) {
            throw new Error(res.error || "Failed to delete service");
          }
          invalidateQuery();
        },
        {
          loading: "Deleting service...",
          success: "Service deleted!",
          error: (e) => `Error: ${e.message}`,
        },
      );
    },
  });

  const submitRequest = (e: FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    toast.promise(
      async () => {
        const req = await fetch("/api/web/create", {
          method: "POST",
          body: formData,
        });
        const res = await req.json();
        if (!res.ok) {
          throw new Error(res.error || "Failed to create service");
        }
        setCurrentAddServiceOpenPanel(false);
        invalidateQuery();
      },
      {
        loading: "Creating service...",
        success: "Service created!",
        error: (e) => `Error: ${e.message}`,
      },
    );
  };

  const sslTypeLabel: Record<string, string> = {
    homecert: "Home Cert",
    letsencrypt_http: "LE HTTP",
    letsencrypt_dns: "LE DNS",
    custom: "Custom",
  };

  return (
    <div className="m-3">
      <h1 className="text-2xl font-bold">Proxy Services</h1>
      <div className="flex flex-col md:flex-row justify-between pb-2">
        <span></span>
        <div className="flex gap-2">
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
          <Dialog
            open={currentAddServiceOpenPanel}
            onOpenChange={setCurrentAddServiceOpenPanel}
          >
            <DialogTrigger asChild>
              <Button className="cursor-pointer hover:bg-accent group transition-all duration-300">
                Add Service{" "}
                <PlusCircle className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Service</DialogTitle>
                <DialogDescription>
                  Add a new service to the proxy or webserver.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submitRequest}>
                <div className="space-y-3">
                  <div>
                    <Label className="pb-1">Service Type</Label>
                    <Tabs
                      value={currentTabStatus}
                      onValueChange={setCurrentTabStatus}
                    >
                      <TabsList>
                        <TabsTrigger value="proxy">Proxy</TabsTrigger>
                        <TabsTrigger value="files">File Server</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <input type="hidden" name="format" value={currentTabStatus} />
                  </div>

                  <div>
                    <Label htmlFor="name" className="pb-1">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Service Name"
                      required
                      type="text"
                    />
                  </div>

                  <div>
                    <Label htmlFor="publicURL" className="pb-1">
                      Public URL (comma separated for multiple)
                    </Label>
                    <Input
                      id="publicURL"
                      name="publicURL"
                      placeholder="example.com, app.example.com"
                      type="text"
                    />
                  </div>

                  <div>
                    <Label className="pb-1">SSL Type</Label>
                    <input type="hidden" name="sslType" value={sslCertType} />
                    <Tabs value={sslCertType} onValueChange={setSslCertType}>
                      <TabsList className="flex-wrap h-auto">
                        <TabsTrigger value="homecert">Home Cert</TabsTrigger>
                        <TabsTrigger value="letsencrypt_http">LE HTTP</TabsTrigger>
                        <TabsTrigger value="letsencrypt_dns">LE DNS</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {sslCertType === "custom" && (
                    <div className="space-y-2 border rounded-md p-3">
                      <Label htmlFor="customCert" className="pb-1">
                        Certificate File (.pem)
                      </Label>
                      <Input
                        type="file"
                        id="customCert"
                        name="customCert"
                        required
                        accept=".pem,.crt,.cer"
                      />
                      <Label htmlFor="customKey" className="pb-1">
                        Private Key File (.pem)
                      </Label>
                      <Input
                        type="file"
                        id="customKey"
                        name="customKey"
                        required
                        accept=".pem,.key"
                      />
                    </div>
                  )}

                  {currentTabStatus === "files" ? (
                    <div>
                      <Label htmlFor="files" className="pb-1">
                        Upload web files (.zip)
                      </Label>
                      <Input type="file" id="files" name="files" required accept=".zip" />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="url" className="pb-1">
                        Upstream Service URL (host:port)
                      </Label>
                      <Input
                        id="url"
                        name="url"
                        placeholder="192.168.1.100:4922"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="listenPort" className="pb-1">
                        Listen Port
                      </Label>
                      <Input
                        id="listenPort"
                        name="listenPort"
                        type="number"
                        defaultValue="443"
                      />
                    </div>
                    <div>
                      <Label htmlFor="listenProtocol" className="pb-1">
                        Protocol
                      </Label>
                      <Tabs defaultValue="https">
                        <TabsList>
                          <TabsTrigger value="https">HTTPS</TabsTrigger>
                          <TabsTrigger value="http">HTTP</TabsTrigger>
                        </TabsList>
                        <input type="hidden" name="listenProtocol" value="https" />
                      </Tabs>
                    </div>
                  </div>

                  {currentTabStatus === "proxy" && (
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="allowWebsocket" name="allowWebsocket" value="true" />
                        <Label htmlFor="allowWebsocket">WebSocket</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="cacheAssets" name="cacheAssets" value="true" />
                        <Label htmlFor="cacheAssets">Cache Assets</Label>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" className="group">
                    Add Service{" "}
                    <PlusCircle className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
            accessorKey: "serviceType",
            header: () => (
              <div className="flex items-center gap-1">
                <ServerIcon className="w-4 h-4" /> Type
              </div>
            ),
            cell: ({ row }) => (
              <span className="flex items-center gap-1">
                {row.getValue("serviceType") === "files" ? (
                  <><FileIcon className="w-3 h-3" /> File Server</>
                ) : (
                  <><ServerIcon className="w-3 h-3" /> Proxy</>
                )}
              </span>
            ),
          },
          {
            accessorKey: "publicUrls",
            header: () => (
              <div className="flex items-center gap-1">
                <GlobeIcon className="w-4 h-4" /> Public URL
              </div>
            ),
            cell: ({ row }) => {
              const urls = row.getValue("publicUrls") as string[];
              return <span>{urls?.join(", ") || "-"}</span>;
            },
          },
          {
            accessorKey: "certificateOrigin",
            header: () => (
              <div className="flex items-center gap-1">
                <ShieldIcon className="w-4 h-4" /> SSL
              </div>
            ),
            cell: ({ row }) => (
              <span>
                {sslTypeLabel[row.getValue("certificateOrigin") as string] ||
                  row.getValue("certificateOrigin")}
              </span>
            ),
          },
          {
            accessorKey: "createdAt",
            header: () => (
              <div className="flex items-center gap-2">
                <CalendarSearch className="w-4 h-4" /> Created
              </div>
            ),
            cell: ({ row }) => (
              <span>
                {new Date(row.getValue("createdAt")).toLocaleString("zh-tw")}
              </span>
            ),
          },
          {
            accessorKey: "id",
            header: () => <span></span>,
            cell: ({ row }) => (
              <Button
                className="group"
                variant="destructive"
                onClick={() => {
                  deleteService.mutate(row.original.id);
                }}
              >
                Delete{" "}
                <Trash2Icon className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
              </Button>
            ),
          },
        ]}
        data={memoedData}
      />
      <div className="flex justify-center pt-3">
        {getAllServices.hasNextPage && (
          getAllServices.isFetchingNextPage ? (
            <Button disabled>Loading...</Button>
          ) : (
            <Button onClick={() => getAllServices.fetchNextPage()}>
              Load More
            </Button>
          )
        )}
      </div>
    </div>
  );
}
