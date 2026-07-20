import Link from "next/link";
import { headers } from "next/headers";
import { AlertTriangle, ArrowLeft, ExternalLink, Globe } from "lucide-react";
import { loadBrief } from "@/lib/builder/actions";
import { buildGenerationSpec } from "@/lib/builder/generation-spec";
import {
  generateEmails,
  generateMarketing,
  generateContacts,
  buildMasterPrompt,
} from "@/lib/builder/generators/content";
import { EmptyState } from "@/components/app/empty-state";
import { CopyBlock } from "@/components/builder/copy-block";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Your tournament kit" };

/**
 * Results dashboard — the generated deliverables for a Brief:
 * a live landing page, ready-to-send emails, a marketing kit, suggested
 * contacts, and a master prompt for a richer AI pass.
 */
export default async function ResultsPage({
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
          title="This kit needs its edit link (with the token) to open."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/builder/intake">Start a new one</Link>
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
        <EmptyState icon={AlertTriangle} title={`Could not load this kit: ${res.error}`} />
      </main>
    );
  }

  const brief = res.brief;
  const spec = buildGenerationSpec(brief);

  // Absolute URL to the live landing page, for links inside generated copy.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const siteUrl = `${proto}://${host}/t/${id}`;

  const emails = generateEmails(spec, siteUrl);
  const marketing = generateMarketing(spec, siteUrl);
  const contacts = generateContacts(spec);
  const masterPrompt = buildMasterPrompt(spec, siteUrl);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/builder/intake">
          <ArrowLeft aria-hidden /> Edit intake
        </Link>
      </Button>

      <header className="mb-6">
        <p className="text-[0.8125rem] font-medium text-orange-600">Your tournament kit is ready</p>
        <h1 className="font-display text-[1.75rem] font-semibold">
          {brief.identity.name || "Your tournament"}
        </h1>
        <p className="text-text-muted">{spec.tournament.oneLiner}</p>
      </header>

      {/* Live landing page */}
      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <Globe aria-hidden className="size-5 text-orange" />
            <div>
              <p className="font-medium">Live landing page</p>
              <p className="font-mono text-[0.8125rem] text-text-muted">/t/{id}</p>
            </div>
          </div>
          <Button asChild>
            <a href={`/t/${id}`} target="_blank" rel="noopener">
              Open live site <ExternalLink aria-hidden />
            </a>
          </Button>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border bg-white">
          <iframe
            title="Landing page preview"
            src={`/t/${id}`}
            className="h-[520px] w-full"
          />
        </div>
      </section>

      {/* Emails */}
      <section className="mb-8 space-y-3">
        <h2 className="font-display text-[1.25rem] font-semibold">Emails</h2>
        {emails.map((e) => (
          <CopyBlock
            key={e.key}
            title={e.label}
            subtitle={`Subject: ${e.subject}`}
            text={`Subject: ${e.subject}\n\n${e.body}`}
          />
        ))}
      </section>

      {/* Marketing kit */}
      <section className="mb-8 space-y-3">
        <h2 className="font-display text-[1.25rem] font-semibold">Marketing kit</h2>
        <CopyBlock title="Instagram captions" text={marketing.instagramCaptions.join("\n\n---\n\n")} />
        <CopyBlock title="Poster hooks" text={marketing.posterHooks.join("\n")} />
        <CopyBlock title="WhatsApp broadcast" text={marketing.whatsappBlurb} />
        <CopyBlock title="Standard description" text={marketing.standardDescription} />
      </section>

      {/* Contacts */}
      <section className="mb-8 space-y-3">
        <h2 className="font-display text-[1.25rem] font-semibold">Who to invite</h2>
        <p className="text-[0.8125rem] text-text-muted">{contacts.note}</p>
        <ul className="divide-y rounded-lg border bg-card">
          {contacts.suggestions.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-[0.9375rem] font-medium">{c.name}</p>
                <p className="text-[0.8125rem] text-text-muted">{c.role}</p>
              </div>
              <span className="rounded-full bg-warn-bg px-2 py-0.5 text-[0.75rem] text-warn">
                {c.confidence} confidence
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Master prompt */}
      <section className="mb-8 space-y-3">
        <h2 className="font-display text-[1.25rem] font-semibold">AI prompt</h2>
        <p className="text-[0.8125rem] text-text-muted">
          Paste this into Claude or ChatGPT for a richer, fully custom pass at the site and copy.
        </p>
        <CopyBlock text={masterPrompt} />
      </section>
    </main>
  );
}
