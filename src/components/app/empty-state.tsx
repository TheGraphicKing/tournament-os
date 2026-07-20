import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** EmptyState — icon + one line + the primary action. Every list has one. */
export function EmptyState({
  icon: Icon,
  title,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  /** The screen's single primary action (a <Button> usually). */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-surface-2/50 px-6 py-12 text-center",
        className
      )}
    >
      <Icon aria-hidden className="size-8 text-text-faint" strokeWidth={1.5} />
      <p className="text-text-muted">{title}</p>
      {action}
    </div>
  );
}
