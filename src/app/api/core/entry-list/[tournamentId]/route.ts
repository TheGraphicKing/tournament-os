/**
 * GET /api/core/entry-list/[tournamentId]
 * REST fallback for App → Core (DATA_MODEL §5): the live-scoring core
 * pulls the locked entry list when it runs as a SEPARATE service rather
 * than sharing this Postgres. Same shape as the core_entry_list view.
 *
 * TODO(rizzfitt): confirm shared-DB vs separate-service with the core dev
 * partner in Phase 0. If shared DB, the core reads core_entry_list
 * directly and this route is unused (but kept as the documented contract).
 *
 * Auth: Bearer token (CORE_API_KEY). Reads with the service role so the
 * core sees all locked entries regardless of RLS.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBearer } from "@/lib/core/auth";
import { coreEntryListSchema } from "@/lib/core/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/core/entry-list/[tournamentId]">
) {
  if (!verifyBearer(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { tournamentId } = await ctx.params;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("core_entry_list")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const parsed = coreEntryListSchema.safeParse(data ?? []);
  if (!parsed.success) {
    return NextResponse.json({ error: "contract_mismatch" }, { status: 500 });
  }

  return NextResponse.json({ tournament_id: tournamentId, entries: parsed.data });
}
