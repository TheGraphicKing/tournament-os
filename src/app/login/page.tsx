"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { phoneSchema } from "@/lib/domain/schemas";
import { FormField } from "@/components/app/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";

const emailSchema = z.string().email("Enter a valid email address");
const otpSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

export default function LoginPage() {
  const [tab, setTab] = useState("phone");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6">
        <h1 className="font-display text-[1.75rem] font-semibold">Sign in</h1>
        <p className="mt-1 text-text-muted">
          Phone OTP is the fastest way in. Email works too.
        </p>
        <Tabs value={tab} onValueChange={setTab} className="mt-5">
          <TabsList className="w-full">
            <TabsTrigger value="phone" className="flex-1">
              Phone
            </TabsTrigger>
            <TabsTrigger value="email" className="flex-1">
              Email
            </TabsTrigger>
          </TabsList>
          <TabsContent value="phone">
            {/* O1 edge: after 3 OTP failures, fall back to email magic link. */}
            <PhoneOtpForm
              onTooManyFailures={() => {
                setTab("email");
                toast.info("Trouble with the code? Try an email magic link instead.");
              }}
            />
          </TabsContent>
          <TabsContent value="email">
            <MagicLinkForm />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function PhoneOtpForm({ onTooManyFailures }: { onTooManyFailures: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"enter_phone" | "enter_code">("enter_phone");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = phoneSchema.safeParse(phone.replace(/\s/g, ""));
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(undefined);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: parsed.data });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success("Code sent by SMS");
    setStage("enter_code");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = otpSchema.safeParse(code.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(undefined);
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({
      phone: phone.replace(/\s/g, ""),
      token: parsed.data,
      type: "sms",
    });
    setBusy(false);
    if (err) {
      const next = fails + 1;
      setFails(next);
      setError(err.message);
      if (next >= 3) onTooManyFailures();
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (stage === "enter_code") {
    return (
      <form onSubmit={verifyOtp} className="mt-4 space-y-4">
        <FormField label="6-digit code" helper={`Sent to ${phone}`} error={error} required>
          {(props) => (
            <Input
              {...props}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="font-mono tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
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
          onClick={() => setStage("enter_phone")}
        >
          Use a different number
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="mt-4 space-y-4">
      <FormField
        label="Phone number"
        helper="International format, e.g. +919876543210"
        error={error}
        required
      >
        {(props) => (
          <Input
            {...props}
            type="tel"
            autoComplete="tel"
            className="font-mono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}
      </FormField>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Sending…" : "Send code"}
      </Button>
    </form>
  );
}

function MagicLinkForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
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
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="mt-4 rounded-md bg-ok-bg p-3 text-[0.9375rem] text-ok">
        Magic link sent — check your inbox and open it on this device.
      </p>
    );
  }

  return (
    <form onSubmit={sendLink} className="mt-4 space-y-4">
      <FormField label="Email" error={error} required>
        {(props) => (
          <Input
            {...props}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </FormField>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Sending…" : "Email me a magic link"}
      </Button>
    </form>
  );
}
