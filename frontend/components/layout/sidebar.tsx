"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ScrollText,
  Users,
  BarChart,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Stok Yönetimi",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Siparişler",
    href: "/orders",
    icon: ScrollText,
  },
  {
    title: "Müşteriler",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Raporlar",
    href: "/reports",
    icon: BarChart,
  },
  {
    title: "Ayarlar",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">SAP Nexus AI</h1>
      </div>
      <nav className="space-y-1 p-4">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent",
                pathname === item.href ? "bg-accent" : "transparent"
              )}
            >
              <IconComponent className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
