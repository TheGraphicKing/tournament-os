import { cn } from "@/lib/utils";
import { STATUS_META, type AnyStatus, type StatusTone } from "@/lib/domain/enums";

/**
 * StatusPill — the spine of the UI (DESIGN_SYSTEM PART 6).
 * Fixed status → colour + human label; always pill + label, never colour
 * alone. The UI never invents a status that isn't in the data model.
 */
const TONE_CLASSES: Record<StatusTone, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  live: "bg-danger-bg text-live",
  neutral: "bg-surface-2 text-text-muted",
};

export function StatusPill({
  status,
  className,
}: {
  status: AnyStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap",
        TONE_CLASSES[meta.tone],
        className
      )}
    >
      {meta.tone === "live" && (
        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-live" />
      )}
      {meta.label}
    </span>
  );
}
