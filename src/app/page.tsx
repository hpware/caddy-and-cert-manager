import Link from "next/link";
import { BadgeCheck, BracketsIcon, Waypoints } from "lucide-react";

const services = [
  {
    name: "Certificate",
    href: "/certs",
    icon: BadgeCheck,
  },
  {
    name: "Proxy",
    href: "/proxy",
    icon: Waypoints,
  },
];

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center absolute inset-0">
      <div className="pb-3 flex flex-col">
        <BracketsIcon className="w-10 h-10" />
        <h1 className="text-2xl font-bold text-left">Core Services</h1>
        <span className="text-background select-none">
          Current Time: {new Date().toLocaleString()}
        </span>
      </div>
      <div className="grid grid-flow-col auto-cols-fr gap-4 justify-center">
        {services.map((service) => (
          <Link
            key={service.name}
            href={service.href}
            className="relative flex flex-col items-center justify-center border p-4 rounded group transition-all duration-300"
          >
            <service.icon className="w-6 h-6 text-primary group-hover:text-accent group-hover:-rotate-10 group-hover:scale-110 transition-all duration-300" />
            <div className="text-xl font-bold whitespace-nowrap">
              {service.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
