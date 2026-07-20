/**
 * POST /api/core/results
 * REST fallback for Core → App (DATA_MODEL §5): the live-scoring core
 * pushes final standings when it runs as a SEPARATE service. Same shape
 * as the results table. Idempotent upsert per (tournament_id, category_id).
 *
 * TODO(rizzfitt): confirm shared-DB vs separate-service with the core dev
 * partner in Phase 0. If shared DB, the core writes the results table
 * directly with the service role and this route is unused.
 *
 * Auth: HMAC-SHA256 signature of the raw body in `x-core-signature`
 * (CORE_SHARED_SECRET). Writes with the service role (results are
 * core-owned; the app is read-mostly).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignature } from "@/lib/core/auth";
import { coreResultsPayloadSchema } from "@/lib/core/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Read the raw body once — the signature is computed over these bytes.
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = coreResultsPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { tournament_id, results } = parsed.data;
  const supabase = createAdminClient();

  const rows = results.map((r) => ({
    tournament_id,
    category_id: r.category_id,
    standings: r.standings,
  }));

  const { error } = await supabase
    .from("results")
    .upsert(rows, { onConflict: "tournament_id,category_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, upserted: rows.length });
}
