"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./form-field";

/**
 * ConfirmDialog — destructive actions need explicit confirmation
 * (APP_RULES 6.4). Set `confirmText` to require typed confirmation;
 * set `requireReason` for logged actions (the reason goes to audit_log).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  confirmText,
  requireReason = false,
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  /** If set, the user must type this exact text to enable confirm. */
  confirmText?: string;
  /** If true, a non-empty reason is required and passed to onConfirm. */
  requireReason?: boolean;
  destructive?: boolean;
  onConfirm: (reason?: string) => void | Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const ready =
    (!confirmText || typed === confirmText) && (!requireReason || reason.trim().length > 0);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm(requireReason ? reason.trim() : undefined);
      onOpenChange(false);
      setTyped("");
      setReason("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {confirmText && (
            <FormField label={`Type "${confirmText}" to confirm`}>
              {(props) => (
                <Input
                  {...props}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                />
              )}
            </FormField>
          )}
          {requireReason && (
            <FormField label="Reason" helper="This is recorded in the audit log." required>
              {(props) => (
                <Textarea
                  {...props}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              )}
            </FormField>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!ready || busy}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
