"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { FormField } from "@/components/app/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

const emailSchema = z.string().email("Enter a valid email address");
const codeSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

/**
 * Sign in with an email one-time code (6 digits). Free via Supabase's
 * built-in email — no SMS provider, no magic-link round-trip. The whole
 * flow: enter email -> receive code -> verify.
 */
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"enter_email" | "enter_code">("enter_email");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(undefined);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success("Code sent — check your inbox");
    setStage("enter_code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const parsed = codeSchema.safeParse(code.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(undefined);
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: parsed.data,
      type: "email",
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6">
        <h1 className="font-display text-[1.75rem] font-semibold">Sign in</h1>
        <p className="mt-1 text-text-muted">
          Enter your email and we&apos;ll send you a 6-digit code.
        </p>

        {!configured && (
          <p className="mt-4 rounded-md bg-warn-bg p-3 text-[0.8125rem] text-warn">
            Sign-in isn&apos;t connected yet. Add the Supabase keys to enable it.
          </p>
        )}

        {stage === "enter_email" ? (
          <form onSubmit={sendCode} className="mt-5 space-y-4">
            <FormField label="Email" error={error} required>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  disabled={!configured}
                />
              )}
            </FormField>
            <Button type="submit" className="w-full" disabled={busy || !configured}>
              {busy ? "Sending…" : "Send code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-5 space-y-4">
            <FormField label="6-digit code" helper={`Sent to ${email}`} error={error} required>
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="font-mono tracking-[0.3em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  autoFocus
                />
              )}
            </FormField>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Verifying…" : "Verify & sign in"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStage("enter_email");
                setError(undefined);
                setCode("");
              }}
            >
              Use a different email
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
