import Link from "next/link";
import { AlertTriangle, ArrowLeft, Sparkles } from "lucide-react";
import { loadBrief } from "@/lib/builder/actions";
import { buildGenerationSpec, renderSpecText } from "@/lib/builder/generation-spec";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Review brief" };

/**
 * Phase 1 proof surface: shows the canonical Tournament Brief and the
 * Generation Spec produced by the synthesis pass. Phases 2 to 4 add the
 * three generation agents that consume this spec.
 */
export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <EmptyState
          icon={AlertTriangle}
          title="This brief needs its edit link (with the token) to open."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/builder/intake">Start a new brief</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const res = await loadBrief(id, token);
  if (!res.ok) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <EmptyState icon={AlertTriangle} title={`Could not load this brief: ${res.error}`} />
      </main>
    );
  }

  const brief = res.brief;
  const spec = buildGenerationSpec(brief);
  const specText = renderSpecText(spec);
  const p = spec.branding.palette;

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/builder/intake">
          <ArrowLeft aria-hidden /> Edit intake
        </Link>
      </Button>

      <header className="mb-6">
        <p className="text-[0.8125rem] font-medium text-orange-600">Synthesis complete</p>
        <h1 className="font-display text-[1.75rem] font-semibold">
          {brief.identity.name || "Your tournament"}
        </h1>
        <p className="text-text-muted">{spec.tournament.oneLiner || "Canonical brief and generation spec are ready."}</p>
      </header>

      {/* Resolved palette (branding is first-class). */}
      <section className="mb-6 rounded-lg border bg-card p-4">
        <h2 className="font-display text-[1rem] font-semibold">Resolved palette</h2>
        <p className="text-[0.8125rem] text-text-muted">
          {p.derived
            ? "No brand color was given, so we fell back to a strong default. You can add colors in the intake."
            : "Built from your brand colors, with contrast enforced."}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {(
            [
              ["Accent", p.accent],
              ["Pressed", p.accentPress],
              ["Secondary", p.secondary],
              ["On accent", p.onAccent],
            ] as const
          ).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="size-8 rounded-md border"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="text-[0.8125rem]">
                {label} <span className="font-mono text-text-faint">{color}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Canonical Brief */}
        <section>
          <h2 className="font-display mb-2 text-[1.25rem] font-semibold">Canonical brief</h2>
          <pre className="max-h-[28rem] overflow-auto rounded-lg border bg-surface-2 p-4 font-mono text-xs leading-relaxed">
            {JSON.stringify(brief, null, 2)}
          </pre>
        </section>

        {/* Generation Spec */}
        <section>
          <h2 className="font-display mb-2 text-[1.25rem] font-semibold">Generation spec</h2>
          <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border bg-surface-2 p-4 font-mono text-xs leading-relaxed">
            {specText}
          </pre>
        </section>
      </div>

      <div className="mt-6 rounded-lg border border-dashed bg-card p-4">
        <div className="flex items-start gap-3">
          <Sparkles aria-hidden className="mt-0.5 size-5 text-orange" />
          <div>
            <p className="font-medium">Next: the three generation agents</p>
            <p className="text-[0.8125rem] text-text-muted">
              This spec feeds the Landing Page, Email, and Marketing agents independently. Those
              arrive in Phases 2 to 4.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
