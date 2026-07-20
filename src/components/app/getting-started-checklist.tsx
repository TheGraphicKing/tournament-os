import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  label: string;
  done: boolean;
  href?: string;
}

/** O3 getting-started checklist — shown on a fresh organiser dashboard. */
export function GettingStartedChecklist({ items }: { items: ChecklistItem[] }) {
  const completed = items.filter((i) => i.done).length;
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[1.25rem] font-semibold">Getting started</h2>
        <span className="font-mono text-[0.8125rem] tabular-nums text-text-muted">
          {completed}/{items.length}
        </span>
      </div>
      <ol className="mt-3 space-y-2">
        {items.map((item, i) => {
          const Row = (
            <div
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2.5",
                item.done ? "border-transparent bg-ok-bg/60" : "bg-surface"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6875rem] tabular-nums",
                  item.done ? "bg-ok text-white" : "border bg-surface text-text-muted"
                )}
              >
                {item.done ? <Check aria-hidden className="size-3" /> : i + 1}
              </span>
              <span className={cn("text-[0.9375rem]", item.done && "text-text-muted line-through")}>
                {item.label}
              </span>
            </div>
          );
          return (
            <li key={item.label}>
              {item.href && !item.done ? (
                <Link href={item.href} className="block transition-colors hover:opacity-80">
                  {Row}
                </Link>
              ) : (
                Row
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
