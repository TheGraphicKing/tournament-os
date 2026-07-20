"use client";

import { useState } from "react";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { FormField } from "@/components/app/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const emailSchema = z.string().email("Enter a valid email address");

/**
 * Sign in with an email link (passwordless). Free via Supabase's built-in
 * email — no SMS provider, no password. Enter email -> receive a one-time
 * sign-in link -> click it -> you're in (exchanged at /auth/callback).
 */
export default function LoginPage() {
  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function sendLink(e: React.FormEvent) {
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
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard`,
      },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6">
        <h1 className="font-display text-[1.75rem] font-semibold">Sign in</h1>
        <p className="mt-1 text-text-muted">
          Enter your email and we&apos;ll send you a secure sign-in link.
        </p>

        {!configured && (
          <p className="mt-4 rounded-md bg-warn-bg p-3 text-[0.8125rem] text-warn">
            Sign-in isn&apos;t connected yet. Add the Supabase keys to enable it.
          </p>
        )}

        {sent ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-md bg-ok-bg p-3 text-ok">
              <MailCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
              <div className="text-[0.9375rem]">
                <p className="font-medium">Check your inbox</p>
                <p className="text-ok/90">
                  We sent a sign-in link to {email}. Open it on this device to continue.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSent(false);
                setError(undefined);
              }}
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="mt-5 space-y-4">
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
              {busy ? "Sending…" : "Email me a sign-in link"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
