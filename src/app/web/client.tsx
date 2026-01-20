"use client";
import { useMemo, useState } from "react";
import Table from "@/components/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogPortal,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
export default function Client() {
  const [currentTabStatus, setCurrentTabStatus] = useState<string>("files");
  return (
    <div className="m-3">
      <h1 className="text-2xl font-bold">Proxy Services</h1>
      <div className="flex flex-col md:flex-row justify-between pb-2">
        <span></span>
        <Dialog>
          <DialogTrigger>
            <Button className="cursor-pointer hover:bg-accent group transition-all duration-300">
              Add Service{" "}
              <PlusCircle className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Service</DialogTitle>
              <DialogDescription>
                Add a new service to the proxy or webserver.
              </DialogDescription>
            </DialogHeader>
            <form>
              <div>
                <Tabs
                  value={currentTabStatus}
                  onValueChange={setCurrentTabStatus}
                >
                  <TabsList>
                    <TabsTrigger value="files">File</TabsTrigger>
                    <TabsTrigger value="proxy">Proxy</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Label htmlFor="name" className="pt-2 pb-1">
                  Name
                </Label>
                <Input id="name" placeholder="Service Name" required />
                <Label htmlFor="publicURL" className="pt-2 pb-1">
                  Public URL (optional)
                </Label>
                <Input id="publicURL" placeholder="example.com" />
                <Label htmlFor="sslType" className="pt-2 pb-1">
                  SSL Type
                </Label>
                <Input id="sslType" hidden value="" />
                <Tabs defaultValue="homecert">
                  <TabsList>
                    <TabsTrigger value="homecert">Home Cert</TabsTrigger>
                    <TabsTrigger value="letsencrypt">Let's Encrypt</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                  </TabsList>
                </Tabs>
                {currentTabStatus === "files" ? (
                  <>
                    <Label htmlFor="files" className="pt-2 pb-1">
                      Upload web files (requires .zip)
                    </Label>
                    <Input type="file" id="files" required />
                  </>
                ) : (
                  <>
                    <Label htmlFor="url" className="pt-2 pb-1">
                      Service URL
                    </Label>
                    <Input id="url" placeholder="192.168.1.100:4922" required />
                  </>
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
      <Table columns={[]} data={[]} />
    </div>
  );
}
