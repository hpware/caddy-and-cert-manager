"use client";
import Link from "next/link";
import { BadgeCheck, BracketsIcon, LogOutIcon, Waypoints } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/components/auth-client";
import { toast } from "sonner";

const services = [
  {
    name: "Certificate",
    href: "/certs",
    icon: BadgeCheck,
  },
  {
    name: "Web",
    href: "/web",
    icon: Waypoints,
  },
  {
    name: "Logout",
    href: "/auth/logout",
    icon: LogOutIcon,
  },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/guest-resources")
  ) {
    return null;
  }
  // actions
  return (
    <>
      <div className="absolute inset-x-0 flex flex-row justify-between text-center z-30 rounded-lg border bg-accent/5 p-2 mx-2 my-1">
        <div></div>
        <div className="flex flex-row justify-center space-x-3">
          {services.map((service) => (
            <Link
              key={service.name}
              href={service.href}
              className="relative flex flex-row items-center justify-center group transition-all duration-300 space-x-2"
            >
              <service.icon className="w-4 h-4 text-primary group-hover:text-accent group-hover:-rotate-10 group-hover:scale-110 transition-all duration-300" />
              <span className="text-xl font-bold whitespace-nowrap">
                {service.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="p-5"></div>
    </>
  );
}
