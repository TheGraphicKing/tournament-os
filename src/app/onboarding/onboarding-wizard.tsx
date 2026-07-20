"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";
import { FormField } from "@/components/app/form-field";
import { WizardStepper } from "@/components/app/wizard-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { saveProfileName, createOrganisation } from "./actions";

const STEPS = [
  { id: "name", label: "Your name" },
  { id: "org", label: "Organisation" },
];

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter();
  // If the name is already known, start on the organisation step.
  const [step, setStep] = useState(initialName ? 1 : 0);

  const [name, setName] = useState(initialName);
  const [orgName, setOrgName] = useState("");
  const [city, setCity] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; orgName?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await saveProfileName({ name });
    setBusy(false);
    if (!res.ok) {
      setErrors({ name: res.error });
      return;
    }
    setErrors({});
    setStep(1);
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Session expired — sign in again.");
        return;
      }
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("org-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  async function submitOrg(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createOrganisation({
      name: orgName,
      city: city || undefined,
      logo_url: logoUrl,
    });
    setBusy(false);
    if (!res.ok) {
      setErrors({ orgName: res.error });
      return;
    }
    setErrors({});
    toast.success("Organisation created");
    // O3 — the dashboard renders the welcome + getting-started checklist.
    router.push("/dashboard");
    router.refresh();
  }

  const slugPreview = orgName ? slugify(orgName) : "";

  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-6">
      <p className="text-[0.8125rem] font-medium text-orange-600">Get started</p>
      <h1 className="font-display mt-1 text-[1.75rem] font-semibold">
        {step === 0 ? "What's your name?" : "Create your organisation"}
      </h1>
      <p className="mt-1 text-text-muted">
        {step === 0
          ? "We'll use this on confirmations and the desk."
          : "Your club or company. You'll be its owner."}
      </p>

      <WizardStepper steps={STEPS} current={step} className="mt-5" />

      {step === 0 ? (
        <form onSubmit={submitName} className="mt-5 space-y-4">
          <FormField label="Full name" error={errors.name} required>
            {(props) => (
              <Input
                {...props}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                autoComplete="name"
                placeholder="Asha Menon"
              />
            )}
          </FormField>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Continue"}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitOrg} className="mt-5 space-y-4">
          <FormField
            label="Organisation name"
            helper={slugPreview ? `Public link: /t · ${slugPreview}` : undefined}
            error={errors.orgName}
            required
          >
            {(props) => (
              <Input
                {...props}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                autoFocus
                placeholder="RizzFitt Sports Club"
              />
            )}
          </FormField>

          <FormField label="City" helper="Where you mostly run events.">
            {(props) => (
              <Input
                {...props}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Chennai"
              />
            )}
          </FormField>

          {/* Logo upload → Supabase storage */}
          <div className="space-y-1.5">
            <span className="text-[0.8125rem] text-text-muted">Logo (optional)</span>
            <div className="flex items-center gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-2">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Organisation logo"
                    width={56}
                    height={56}
                    className="size-full object-cover"
                    unoptimized
                  />
                ) : (
                  <ImagePlus aria-hidden className="size-5 text-text-faint" />
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" /> Uploading…
                  </>
                ) : logoUrl ? (
                  "Replace logo"
                ) : (
                  "Upload logo"
                )}
              </Button>
            </div>
            <p className="text-[0.8125rem] text-text-faint">
              Used to theme your public event pages later.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            {!initialName && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(0)}
                disabled={busy}
              >
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={busy || uploading}>
              {busy ? "Creating…" : "Create organisation"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
