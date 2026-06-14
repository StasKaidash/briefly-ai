"use client";

import { LayoutDashboard, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex h-dvh w-60 shrink-0 flex-col border-r">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 text-base font-bold tracking-tight"
        >
          <span className="bg-primary/15 text-primary grid h-7 w-7 place-items-center rounded-md">
            <Sparkles className="h-4 w-4" />
          </span>
          briefly
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-sidebar-border border-t p-2">
        <UserMenu email={email} />
      </div>
    </aside>
  );
}
