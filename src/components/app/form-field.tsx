import { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * FormField — label + control + helper + inline error (never alert()-style).
 * The control is render-prop'd so any input/select/textarea gets correct
 * ids and aria wiring for free.
 */
export function FormField({
  label,
  helper,
  error,
  required,
  className,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, helper ? helperId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-[0.8125rem] text-text-muted">
        {label}
        {required && (
          <span aria-hidden className="text-danger">
            *
          </span>
        )}
      </Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {helper && !error && (
        <p id={helperId} className="text-[0.8125rem] text-text-faint">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[0.8125rem] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
