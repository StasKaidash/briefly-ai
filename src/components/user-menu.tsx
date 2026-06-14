"use client";

import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/actions/logout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ email }: { email: string }) {
  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="hover:bg-sidebar-accent h-auto w-full justify-start gap-2 px-2 py-2"
        >
          {/*
            Plain div instead of shadcn <Avatar>: the primitive's `after:`
            border ring uses mix-blend-lighten on dark mode, which on the
            already-dark sidebar lit up the fallback into a bright cream
            blob. A flat sidebar-accent circle tones with the surroundings.
          */}
          <span
            aria-hidden
            className="bg-sidebar-accent text-sidebar-accent-foreground inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold"
          >
            {initial}
          </span>
          <span className="flex-1 truncate text-left text-xs">{email}</span>
          <ChevronsUpDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-56"
      >
        <DropdownMenuLabel className="truncate text-xs font-normal">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
