import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** StatCard — big mono number + label + optional delta (dashboards). */
export function StatCard({
  label,
  value,
  delta,
  hint,
  className,
}: {
  label: string;
  /** Pre-formatted value — numbers/money render in mono automatically. */
  value: string | number;
  /** Positive = up (ok), negative = down (danger). */
  delta?: number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <p className="text-[0.8125rem] text-text-muted">{label}</p>
      <p className="font-display mt-1 font-mono text-[1.75rem] font-semibold tabular-nums">
        {value}
      </p>
      {delta !== undefined && (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-0.5 font-mono text-[0.8125rem] tabular-nums",
            delta >= 0 ? "text-ok" : "text-danger"
          )}
        >
          {delta >= 0 ? (
            <ArrowUpRight aria-hidden className="size-3.5" />
          ) : (
            <ArrowDownRight aria-hidden className="size-3.5" />
          )}
          {delta >= 0 ? "+" : ""}
          {delta}
          <span className="sr-only">{delta >= 0 ? "increase" : "decrease"}</span>
        </p>
      )}
      {hint && <p className="mt-1 text-[0.8125rem] text-text-faint">{hint}</p>}
    </div>
  );
}
