import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, Plus, Sparkles, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getProfile } from "@/lib/auth/session";
import { AppShell, type NavItem } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import {
  GettingStartedChecklist,
  type ChecklistItem,
} from "@/components/app/getting-started-checklist";
import { TournamentCard, type TournamentCardData } from "@/components/app/tournament-card";
import { Button } from "@/components/ui/button";
import type { TournamentStatus } from "@/lib/domain/enums";

export const metadata = { title: "Dashboard" };

const NAV: NavItem[] = [{ href: "/dashboard", label: "Overview", icon: Home }];

const PUBLIC_STATUSES: TournamentStatus[] = [
  "published",
  "reg_open",
  "reg_closed",
  "live",
  "completed",
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  // Memberships gate which orgs the user can see (RLS + this query).
  const { data: memberships, error: mErr } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id);
  if (mErr) throw mErr;
  if (!memberships || memberships.length === 0) redirect("/onboarding");

  const orgIds = memberships.map((m) => m.org_id);
  const { data: orgs, error: oErr } = await supabase
    .from("organisations")
    .select("id, name, slug, city")
    .in("id", orgIds);
  if (oErr) throw oErr;

  // Resolve the active org from ?org= (only if the user is a member), else
  // the first org.
  const { org: requestedOrg } = await searchParams;
  const activeOrgId =
    requestedOrg && orgIds.includes(requestedOrg) ? requestedOrg : orgIds[0];
  const activeOrg = orgs?.find((o) => o.id === activeOrgId);

  // Tournaments for the active org. RLS ("members read org tournaments")
  // means a user only ever sees their own org's events.
  const { data: tournaments, error: tErr } = await supabase
    .from("tournaments")
    .select("id, slug, name, status, city, start_date, end_date")
    .eq("org_id", activeOrgId)
    .order("created_at", { ascending: false });
  if (tErr) throw tErr;

  const list = (tournaments ?? []) as TournamentCardData[];
  const hasAny = list.length > 0;
  const hasPublished = list.some((t) => PUBLIC_STATUSES.includes(t.status));

  const orgOptions = (orgs ?? []).map((o) => ({
    id: o.id,
    label: o.name,
    href: `/dashboard?org=${o.id}`,
  }));

  const profile = await getProfile();
  const newTournamentHref = "/dashboard/tournaments/new";

  const checklist: ChecklistItem[] = [
    { label: "Create your organisation", done: true },
    { label: "Create your first tournament", done: hasAny, href: newTournamentHref },
    { label: "Add categories & fees", done: hasAny, href: newTournamentHref },
    { label: "Publish & share your event", done: hasPublished, href: newTournamentHref },
  ];

  return (
    <AppShell
      nav={NAV}
      orgs={orgOptions}
      activeOrgId={activeOrgId}
      userName={profile?.name ?? undefined}
    >
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[1.75rem] font-semibold">
              {hasAny ? "Tournaments" : `Welcome${profile?.name ? `, ${profile.name}` : ""}`}
            </h1>
            <p className="text-text-muted">
              {activeOrg?.name}
              {activeOrg?.city ? ` · ${activeOrg.city}` : ""}
            </p>
          </div>
          {hasAny && (
            <Button asChild>
              <Link href={newTournamentHref}>
                <Plus aria-hidden /> New tournament
              </Link>
            </Button>
          )}
        </header>

        {hasAny ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <EmptyState
                icon={Trophy}
                title="No tournaments yet — your first event is a few minutes away."
                action={
                  <div className="flex flex-col items-center gap-2">
                    <Button asChild>
                      <Link href={newTournamentHref}>
                        <Plus aria-hidden /> Create your first tournament
                      </Link>
                    </Button>
                    {/* The builder turns a description into a live site +
                        campaign, a fast way to see value before any data. */}
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/builder">
                        <Sparkles aria-hidden /> Try the tournament builder
                      </Link>
                    </Button>
                  </div>
                }
              />
            </div>
            <GettingStartedChecklist items={checklist} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
