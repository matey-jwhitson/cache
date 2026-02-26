"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  DollarSign,
  BarChart3,
  TrendingUp,
  Search,
  FileText,
  CheckCircle,
  Grid3X3,
  Repeat,
  Building2,
  Users,
  Database,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Control Panel", icon: LayoutDashboard },
  { href: "/cost", label: "Cost Dashboard", icon: DollarSign },
  { href: "/overview", label: "Overview", icon: BarChart3 },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/intents", label: "Intent Explorer", icon: Search },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/content-qa", label: "Content QA", icon: CheckCircle },
  { href: "/alignment", label: "Alignment", icon: Grid3X3 },
  { href: "/reinforcement", label: "Reinforcement", icon: Repeat },
  { href: "/brand", label: "Brand Profile", icon: Building2 },
  { href: "/icps", label: "ICPs", icon: Users },
  { href: "/sources", label: "Content Sources", icon: Database },
  { href: "/changelog", label: "Changelog", icon: ClipboardList },
] as const;

interface SidebarNavProps {
  userName?: string | null;
  userImage?: string | null;
}

export function SidebarNav({ userName, userImage }: SidebarNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-white">Cache</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600/15 text-blue-400"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white",
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3">
          {userImage ? (
            <img
              src={userImage}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
              {userName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {userName ?? "User"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
