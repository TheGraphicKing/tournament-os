import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { StatusPill } from "./status-pill";
import type { TournamentStatus } from "@/lib/domain/enums";

export interface TournamentCardData {
  id: string;
  slug: string;
  name: string;
  status: TournamentStatus;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
}

function formatRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  if (!end || end === start) return start;
  return `${start} → ${end}`;
}

/** A single tournament in the dashboard list. */
export function TournamentCard({ t }: { t: TournamentCardData }) {
  const range = formatRange(t.start_date, t.end_date);
  return (
    <Link
      href={`/dashboard/tournaments/${t.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:border-orange/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[1rem] font-semibold">{t.name}</h3>
        <StatusPill status={t.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-text-muted">
        {range && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden className="size-3.5" />
            <span className="font-mono tabular-nums">{range}</span>
          </span>
        )}
        {t.city && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden className="size-3.5" />
            {t.city}
          </span>
        )}
      </div>
    </Link>
  );
}
