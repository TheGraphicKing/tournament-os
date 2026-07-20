import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import type { TournamentStatus } from "@/lib/domain/enums";

export const metadata = { title: "Tournament" };

/**
 * Minimal tournament detail shell. Full management (Flow A7 overview,
 * entries, payments, comms) arrives in later phases.
 * TODO(rizzfitt): build out the manage surface.
 */
export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  // RLS ("members read org tournaments") returns the row only if the user
  // is a member of its org — otherwise this is empty → 404.
  const { data: t, error } = await supabase
    .from("tournaments")
    .select("id, name, status, city, start_date, end_date")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!t) notFound();

  const range =
    t.start_date && t.end_date && t.end_date !== t.start_date
      ? `${t.start_date} → ${t.end_date}`
      : t.start_date;

  return (
    <main className="mx-auto max-w-[1200px] p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/dashboard">
          <ArrowLeft aria-hidden /> Dashboard
        </Link>
      </Button>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] font-semibold">{t.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 text-[0.8125rem] text-text-muted">
            {range && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden className="size-3.5" />
                <span className="font-mono tabular-nums">{range}</span>
              </span>
            )}
            {t.city && <span>{t.city}</span>}
          </div>
        </div>
        <StatusPill status={t.status as TournamentStatus} />
      </header>

      <div className="mt-6">
        <EmptyState
          icon={CalendarDays}
          title="Management for this event — overview, entries, payments, comms — arrives in the next phase."
        />
      </div>
    </main>
  );
}
