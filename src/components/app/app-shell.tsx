"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface SwitcherOption {
  id: string;
  label: string;
  href: string;
}

/**
 * AppShell — app chrome (always RizzFitt brand, never themed per
 * organiser). Top bar: org switcher, tournament switcher, profile.
 * Left nav on desktop; collapses to a bottom tab bar on mobile
 * (primary actions stay thumb-reachable).
 */
export function AppShell({
  nav,
  orgs,
  activeOrgId,
  tournaments,
  activeTournamentId,
  userName,
  children,
}: {
  nav: NavItem[];
  orgs: SwitcherOption[];
  activeOrgId?: string;
  tournaments?: SwitcherOption[];
  activeTournamentId?: string;
  userName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeOrg = orgs.find((o) => o.id === activeOrgId);
  const activeTournament = tournaments?.find((t) => t.id === activeTournamentId);

  return (
    <div className="min-h-dvh bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-surface">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4">
          <Link href="/" className="font-display text-base font-semibold text-orange">
            Tournament OS
          </Link>
          <span aria-hidden className="text-text-faint">/</span>
          <Switcher label="Organisation" options={orgs} active={activeOrg} />
          {tournaments && tournaments.length > 0 && (
            <>
              <span aria-hidden className="text-text-faint">/</span>
              <Switcher label="Tournament" options={tournaments} active={activeTournament} />
            </>
          )}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Profile menu" className="rounded-full">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-orange-050 text-[0.8125rem] font-medium text-orange-600">
                      {(userName ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userName ?? "Account"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/auth/signout" method="post" className="w-full">
                    <button type="submit" className="w-full text-left">
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px]">
        {/* Left nav (desktop) */}
        <nav aria-label="Main" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 border-r p-3 lg:block">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-[0.9375rem] transition-colors",
                      active
                        ? "bg-orange-050 font-medium text-orange-600"
                        : "text-text-muted hover:bg-surface-2 hover:text-text"
                    )}
                  >
                    <item.icon aria-hidden className="size-4.5" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content */}
        <main className="min-w-0 flex-1 p-4 pb-20 sm:p-6 lg:pb-6">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex">
          {nav.slice(0, 5).map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[0.6875rem]",
                    active ? "text-orange-600" : "text-text-muted"
                  )}
                >
                  <item.icon aria-hidden className="size-5" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function Switcher({
  label,
  options,
  active,
}: {
  label: string;
  options: SwitcherOption[];
  active?: SwitcherOption;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-44 gap-1 font-normal">
          <span className="truncate">{active?.label ?? `Select ${label.toLowerCase()}`}</span>
          <ChevronsUpDown aria-hidden className="size-3.5 text-text-faint" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => (
          <DropdownMenuItem key={o.id} asChild>
            <Link href={o.href}>{o.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
