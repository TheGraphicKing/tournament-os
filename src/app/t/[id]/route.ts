import { loadPublicBrief } from "@/lib/builder/actions";
import { buildGenerationSpec } from "@/lib/builder/generation-spec";
import { renderLandingHtml } from "@/lib/builder/generators/landing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The live tournament landing page. Generated from the stored Brief and
 * served as a standalone HTML document at /t/[id] (no app chrome).
 */
export async function GET(_req: Request, ctx: RouteContext<"/t/[id]">) {
  const { id } = await ctx.params;
  const res = await loadPublicBrief(id);

  if (!res.ok) {
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>Not found</title>
       <body style="font-family:system-ui;padding:40px;text-align:center">
       <h1>Tournament not found</h1><p>This link may be incorrect or the page was removed.</p></body>`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  const html = renderLandingHtml(buildGenerationSpec(res.brief));
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
