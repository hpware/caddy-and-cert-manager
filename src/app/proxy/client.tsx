import { useMemo } from "react";
import Table from "@/components/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
export default function Client() {
  return (
    <div className="m-3">
      <h1 className="text-2xl font-bold">Proxy Services</h1>
      <div className="flex flex-col md:flex-row justify-between pb-2">
        <span>Current Time: {new Date().toLocaleString()}</span>
        <Button className="cursor-pointer hover:bg-accent group transition-all duration-300">
          Add Service{" "}
          <PlusCircle className="group-hover:scale-110 group-hover:-rotate-10 transition-all duration-300" />
        </Button>
      </div>
      <Table columns={[]} data={[]} />
    </div>
  );
}
