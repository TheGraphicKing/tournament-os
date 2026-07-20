"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { briefSchema, validateRequired, type TournamentBrief } from "./brief";
import { buildGenerationSpec } from "./generation-spec";

export type BuilderResult =
  | { ok: true; id: string; token: string }
  | { ok: false; error: string };

/**
 * Synthesis Pass 1 (form path): normalize raw form input into the canonical
 * Brief, run the deterministic Generation Spec, and persist both. Returns
 * the id + edit_token that address the Brief from here on.
 */
export async function createBriefFromForm(raw: unknown): Promise<BuilderResult> {
  const parsed = briefSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid brief." };
  }
  const brief = parsed.data;

  const missing = validateRequired(brief);
  if (missing.length) return { ok: false, error: missing.join(" ") };

  const spec = buildGenerationSpec(brief);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("builder_create_brief", {
    p_brief: brief as unknown as Json,
    p_spec: spec as unknown as Json,
  });
  if (error) return { ok: false, error: error.message };

  const row = data?.[0];
  if (!row) return { ok: false, error: "Could not save the brief." };
  return { ok: true, id: row.id, token: row.edit_token };
}

/** Load a Brief by id only, for the PUBLIC landing page (no token). */
export async function loadPublicBrief(
  id: string
): Promise<{ ok: true; brief: TournamentBrief } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("builder_render_brief", { p_id: id });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Not found." };
  const parsed = briefSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "Stored brief is malformed." };
  return { ok: true, brief: parsed.data };
}

/** Load a Brief by id + edit token (token is the capability). */
export async function loadBrief(
  id: string,
  token: string
): Promise<{ ok: true; brief: TournamentBrief } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("builder_load_brief", {
    p_id: id,
    p_token: token,
  });
  if (error) return { ok: false, error: error.message };
  const parsed = briefSchema.safeParse(data?.brief);
  if (!parsed.success) return { ok: false, error: "Stored brief is malformed." };
  return { ok: true, brief: parsed.data };
}

/** Re-run synthesis on an edited Brief and persist (regenerate over edit). */
export async function saveBrief(
  id: string,
  token: string,
  raw: unknown
): Promise<BuilderResult> {
  const parsed = briefSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid brief." };
  }
  const brief = parsed.data;
  const missing = validateRequired(brief);
  if (missing.length) return { ok: false, error: missing.join(" ") };

  const spec = buildGenerationSpec(brief);
  const supabase = await createClient();
  const { error } = await supabase.rpc("builder_save_brief", {
    p_id: id,
    p_token: token,
    p_brief: brief as unknown as Json,
    p_spec: spec as unknown as Json,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, id, token };
}
