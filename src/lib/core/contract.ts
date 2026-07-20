/**
 * Core-integration contract (DATA_MODEL §5) — the shapes the app and the
 * live-scoring core agree on. Used by BOTH the shared-DB read API
 * (src/lib/core/read.ts) and the REST fallback (src/app/api/core/*), so
 * the boundary is identical whichever Phase-0 decision is made.
 *
 * TODO(rizzfitt): confirm shared-DB vs separate-service with the core dev
 * partner. These schemas are the single source of truth either way.
 */
import { z } from "zod";
import { MATCH_STATUSES } from "@/lib/domain/enums";
import { claimStatusSchema, categoryFormatSchema, categoryKindSchema, entryStatusSchema } from "@/lib/domain/schemas";

const uuid = z.string().uuid();
const timestamp = z.string();

export const matchStatusSchema = z.enum(MATCH_STATUSES);

/* ── App → Core: locked entry list (core_entry_list view rows) ──────── */

/** One resolved roster member of a team entry. */
export const coreTeamMemberSchema = z.object({
  user_id: uuid,
  name: z.string().nullable(),
  phone: z.string().nullable(),
  claim_status: claimStatusSchema,
  is_payer: z.boolean(),
});

/** One locked (confirmed/checked_in) entry, teams resolved. */
export const coreEntryListRowSchema = z.object({
  tournament_id: uuid,
  category_id: uuid,
  category_name: z.string(),
  format: categoryFormatSchema,
  kind: categoryKindSchema,
  category_sort_order: z.number().int(),
  entry_id: uuid,
  status: entryStatusSchema, // always 'confirmed' | 'checked_in' here
  is_multi_entry: z.boolean(),
  primary_user_id: uuid,
  player_name: z.string().nullable(),
  player_phone: z.string().nullable(),
  team_id: uuid.nullable(),
  team_name: z.string().nullable(),
  team_members: z.array(coreTeamMemberSchema),
  confirmed_at: timestamp.nullable(),
  checked_in_at: timestamp.nullable(),
});

export const coreEntryListSchema = z.array(coreEntryListRowSchema);

/* ── Core → App: matches (core writes, app reads-mostly) ────────────── */

export const matchSchema = z.object({
  id: uuid,
  tournament_id: uuid,
  category_id: uuid,
  home_entry_id: uuid.nullable(),
  away_entry_id: uuid.nullable(),
  home_team_id: uuid.nullable(),
  away_team_id: uuid.nullable(),
  round: z.string().nullable(),
  court: z.string().nullable(),
  scheduled_at: timestamp.nullable(),
  status: matchStatusSchema,
  score: z.unknown().nullable(),
  live_score: z.unknown().nullable(),
  winner_side: z.enum(["home", "away"]).nullable(),
  starts_label: z.string().nullable(),
  created_at: timestamp,
  updated_at: timestamp,
});

/* ── Core → App: results.standings (written at finals) ──────────────── */

export const resultStandingsSchema = z.array(
  z.object({
    rank: z.number().int().positive(),
    entry_id: uuid.optional(),
    team_id: uuid.optional(),
    name: z.string(),
    detail: z.string().optional(),
  })
);

export const coreResultRowSchema = z.object({
  category_id: uuid,
  standings: resultStandingsSchema,
});

/** POST /api/core/results payload — the core posts final standings. */
export const coreResultsPayloadSchema = z.object({
  tournament_id: uuid,
  results: z.array(coreResultRowSchema).min(1),
});

export type CoreTeamMember = z.infer<typeof coreTeamMemberSchema>;
export type CoreEntryListRow = z.infer<typeof coreEntryListRowSchema>;
export type Match = z.infer<typeof matchSchema>;
export type ResultStandings = z.infer<typeof resultStandingsSchema>;
export type CoreResultsPayload = z.infer<typeof coreResultsPayloadSchema>;
