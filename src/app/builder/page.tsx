import Link from "next/link";
import { ArrowRight, Globe, Mail, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Tournament builder" };

const OUTPUTS = [
  { icon: Globe, title: "A live website", body: "A beautiful single-page tournament site on its own URL." },
  { icon: Mail, title: "An email campaign", body: "Ready-to-send emails, contacts to invite, and clash warnings." },
  { icon: Megaphone, title: "A marketing kit", body: "On-brand captions and blurbs you can post right away." },
];

export default function BuilderHome() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 p-6">
      <div>
        <p className="text-[0.8125rem] font-medium text-orange-600">Rizzfitt tournament builder</p>
        <h1 className="font-display mt-1 text-[2rem] font-semibold leading-tight">
          Describe your tournament once. Get a website, emails, and a marketing kit. Automatically.
        </h1>
        <p className="mt-2 text-text-muted">
          No web developer, no copywriter, no manual contact hunting. Rizzfitt runs match day.
          This gets people there.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        {OUTPUTS.map((o) => (
          <li key={o.title} className="rounded-lg border bg-card p-4">
            <o.icon aria-hidden className="size-5 text-orange" />
            <h2 className="mt-2 font-display text-[1rem] font-semibold">{o.title}</h2>
            <p className="mt-1 text-[0.8125rem] text-text-muted">{o.body}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href="/builder/intake">
            Start building <ArrowRight aria-hidden />
          </Link>
        </Button>
        <span className="text-[0.8125rem] text-text-faint">Takes about two minutes.</span>
      </div>
    </main>
  );
}
