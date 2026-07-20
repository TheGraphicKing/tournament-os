"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WizardStepper — numbered steps + progress. The hosting form owns
 * save-on-blur (forms never lose data); completed steps are clickable.
 */
export function WizardStepper({
  steps,
  current,
  onStepClick,
  className,
}: {
  steps: { id: string; label: string }[];
  /** Zero-based index of the active step. */
  current: number;
  /** Only steps already completed (index < current) are navigable. */
  onStepClick?: (index: number) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center gap-2 overflow-x-auto">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-2">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn("h-px w-6 sm:w-10", done || active ? "bg-orange" : "bg-border")}
                />
              )}
              <button
                type="button"
                disabled={!done || !onStepClick}
                onClick={() => onStepClick?.(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[0.8125rem] transition-colors",
                  active && "bg-orange-050 font-medium text-orange-600",
                  done && "text-text-muted hover:text-text",
                  !done && !active && "text-text-faint",
                  done && onStepClick && "cursor-pointer"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full font-mono text-xs tabular-nums",
                    active && "bg-orange text-white",
                    done && "bg-ok text-white",
                    !done && !active && "border bg-surface"
                  )}
                >
                  {done ? <Check aria-hidden className="size-3.5" /> : i + 1}
                </span>
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
