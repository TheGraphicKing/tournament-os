"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A labeled text block with a copy-to-clipboard button. */
export function CopyBlock({
  title,
  subtitle,
  text,
}: {
  title?: string;
  subtitle?: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-2.5">
        <div>
          {title && <p className="text-[0.9375rem] font-medium">{title}</p>}
          {subtitle && <p className="text-[0.8125rem] text-text-muted">{subtitle}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? (
            <>
              <Check aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy aria-hidden /> Copy
            </>
          )}
        </Button>
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[0.8125rem] leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
