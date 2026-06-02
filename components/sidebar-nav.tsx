"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CircleGauge,
  LineChart,
  Settings,
  Split,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/overview", label: "Bosh sahifa", icon: CircleGauge },
  { href: "/ads", label: "Reklama", icon: LineChart },
  { href: "/crm-funnel", label: "Sotuv varonkasi", icon: Split },
  { href: "/operators", label: "Operatorlar", icon: Users },
  { href: "/alerts", label: "Ogohlantirishlar", icon: AlertTriangle },
  { href: "/settings", label: "Sozlamalar", icon: Settings }
];

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:flex-col lg:overflow-x-visible lg:px-3 lg:pb-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={`${item.href}${suffix}`}
            className={cn(
              "flex h-10 min-w-fit items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:min-w-0",
              active && "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
