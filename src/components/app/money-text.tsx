import { cn } from "@/lib/utils";

/**
 * MoneyText — mono, tabular, always shows the currency (₹).
 * Money is never trusted from the client; this only renders
 * server-computed amounts.
 */
const formatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function MoneyText({
  amountInr,
  className,
}: {
  amountInr: number;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      ₹{formatter.format(amountInr)}
    </span>
  );
}
