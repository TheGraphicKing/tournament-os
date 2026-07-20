/**
 * Typed read API for the core boundary (DATA_MODEL §5, Core → App).
 * The public live & results pages and the ops report read through these.
 * App-side reads use the request-scoped client so RLS applies (public
 * sees only published tournaments). The core itself writes matches/results
 * with the service role.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  coreEntryListSchema,
  matchSchema,
  type CoreEntryListRow,
  type Match,
} from "./contract";

/** App → Core handoff: locked entries for a tournament, teams resolved. */
export async function getCoreEntryList(tournamentId: string): Promise<CoreEntryListRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("core_entry_list")
    .select("*")
    .eq("tournament_id", tournamentId);
  if (error) throw error;
  return coreEntryListSchema.parse(data ?? []);
}

/** Matches for the public live/schedule pages. Optionally filter by category. */
export async function getMatches(
  tournamentId: string,
  opts?: { categoryId?: string }
): Promise<Match[]> {
  const supabase = await createClient();
  let query = supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("scheduled_at", { ascending: true, nullsFirst: false });
  if (opts?.categoryId) query = query.eq("category_id", opts.categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => matchSchema.parse(row));
}

/** Standings per category for the public results board (read-mostly). */
export async function getResults(tournamentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select("category_id, standings")
    .eq("tournament_id", tournamentId);
  if (error) throw error;
  return data ?? [];
}
