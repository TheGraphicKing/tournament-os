"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  emptyBrief,
  STANDARD_CATEGORIES,
  FORMAT_STRUCTURES,
  FORMAT_STRUCTURE_LABELS,
  TONES,
  type TournamentBrief,
  type FormatStructure,
  type Tone,
} from "@/lib/builder/brief";
import { createBriefFromForm } from "@/lib/builder/actions";
import { FormField } from "@/components/app/form-field";
import { WizardStepper } from "@/components/app/wizard-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/lib/toast";

const STEPS = [
  { id: "identity", label: "Identity" },
  { id: "when", label: "Dates & venue" },
  { id: "categories", label: "Categories & format" },
  { id: "prizes", label: "Prizes & sponsors" },
  { id: "registration", label: "Registration" },
  { id: "branding", label: "Branding" },
  { id: "marketing", label: "Marketing" },
];

const MARKETING_CHANNELS = ["email", "instagram", "whatsapp", "facebook"] as const;

const selectClass =
  "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function IntakeForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<TournamentBrief>(emptyBrief);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Section patch helpers keep updates terse and type-safe.
  type B = TournamentBrief;
  function patch<K extends keyof B>(section: K, value: Partial<B[K]>) {
    setBrief((b) => ({ ...b, [section]: { ...b[section], ...value } }));
  }

  function validateStep(i: number): boolean {
    const e: Record<string, string> = {};
    if (i === 0 && brief.identity.name.trim().length < 2) e.name = "Tournament name is required.";
    if (i === 1) {
      if (!brief.dates.start_date.trim()) e.start = "A start date is required.";
      if (!brief.venue.city.trim()) e.city = "City is required.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("builder-logos")
        .upload(path, file, { contentType: file.type });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("builder-logos").getPublicUrl(path);
      patch("branding", { logo_url: data.publicUrl, logo_provided: true });
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    // Final guard: the three hard-required fields (§7).
    for (const i of [0, 1]) if (!validateStep(i)) return setStep(i);
    setBusy(true);
    const res = await createBriefFromForm(brief);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Brief created");
    router.push(`/builder/${res.id}/review?token=${res.token}`);
  }

  // ── Category & sponsor editors ─────────────────────────────────────
  const addCategory = (label = "") =>
    setBrief((b) => ({
      ...b,
      categories: [...b.categories, { label, skill_or_age_bracket: "", entry_fee: "", max_slots: "" }],
    }));
  const updateCategory = (i: number, key: keyof B["categories"][number], v: string) =>
    setBrief((b) => ({
      ...b,
      categories: b.categories.map((c, idx) => (idx === i ? { ...c, [key]: v } : c)),
    }));
  const removeCategory = (i: number) =>
    setBrief((b) => ({ ...b, categories: b.categories.filter((_, idx) => idx !== i) }));

  const addSponsor = () =>
    setBrief((b) => ({
      ...b,
      sponsors: [...b.sponsors, { name: "", tier: "", logo_provided: false }],
    }));
  const updateSponsor = (i: number, patchS: Partial<B["sponsors"][number]>) =>
    setBrief((b) => ({
      ...b,
      sponsors: b.sponsors.map((s, idx) => (idx === i ? { ...s, ...patchS } : s)),
    }));
  const removeSponsor = (i: number) =>
    setBrief((b) => ({ ...b, sponsors: b.sponsors.filter((_, idx) => idx !== i) }));

  const toggleChannel = (ch: string) =>
    setBrief((b) => ({
      ...b,
      marketing: {
        ...b.marketing,
        channels: b.marketing.channels.includes(ch)
          ? b.marketing.channels.filter((c) => c !== ch)
          : [...b.marketing.channels, ch],
      },
    }));

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-5">
        <p className="text-[0.8125rem] font-medium text-orange-600">Tournament builder</p>
        <h1 className="font-display text-[1.75rem] font-semibold">Describe your tournament</h1>
        <p className="text-text-muted">
          Fill what you can. Only the name, start date, and city are required. We generate the rest.
        </p>
      </header>

      <WizardStepper steps={STEPS} current={step} onStepClick={setStep} className="mb-6" />

      <div className="rounded-lg border bg-card p-5">
        {/* Step 0 — identity */}
        {step === 0 && (
          <div className="space-y-4">
            <FormField label="Tournament name" error={errors.name} required>
              {(p) => (
                <Input
                  {...p}
                  value={brief.identity.name}
                  onChange={(e) => patch("identity", { name: e.target.value })}
                  placeholder="RizzFitt Pickleball Open"
                  autoFocus
                />
              )}
            </FormField>
            <FormField label="Tagline" helper="One punchy line for the hero.">
              {(p) => (
                <Input
                  {...p}
                  value={brief.identity.tagline}
                  onChange={(e) => patch("identity", { tagline: e.target.value })}
                  placeholder="Two days. Every level. One champion."
                />
              )}
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Edition">
                {(p) => (
                  <Input
                    {...p}
                    value={brief.identity.edition}
                    onChange={(e) => patch("identity", { edition: e.target.value })}
                    placeholder="3rd edition"
                  />
                )}
              </FormField>
              <FormField label="Year">
                {(p) => (
                  <Input
                    {...p}
                    value={brief.identity.year}
                    onChange={(e) => patch("identity", { year: e.target.value })}
                    placeholder="2026"
                    inputMode="numeric"
                  />
                )}
              </FormField>
            </div>
          </div>
        )}

        {/* Step 1 — dates & venue */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Start date" error={errors.start} required>
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    value={brief.dates.start_date}
                    onChange={(e) => patch("dates", { start_date: e.target.value })}
                  />
                )}
              </FormField>
              <FormField label="End date">
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    value={brief.dates.end_date}
                    onChange={(e) => patch("dates", { end_date: e.target.value })}
                  />
                )}
              </FormField>
              <FormField label="Registration deadline">
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    value={brief.dates.registration_deadline}
                    onChange={(e) => patch("dates", { registration_deadline: e.target.value })}
                  />
                )}
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Venue name">
                {(p) => (
                  <Input
                    {...p}
                    value={brief.venue.name}
                    onChange={(e) => patch("venue", { name: e.target.value })}
                    placeholder="Marina Indoor Courts"
                  />
                )}
              </FormField>
              <FormField label="City" error={errors.city} required>
                {(p) => (
                  <Input
                    {...p}
                    value={brief.venue.city}
                    onChange={(e) => patch("venue", { city: e.target.value })}
                    placeholder="Chennai"
                  />
                )}
              </FormField>
            </div>
            <FormField label="Address">
              {(p) => (
                <Input
                  {...p}
                  value={brief.venue.address}
                  onChange={(e) => patch("venue", { address: e.target.value })}
                  placeholder="12 Beach Road"
                />
              )}
            </FormField>
            <FormField label="Map link">
              {(p) => (
                <Input
                  {...p}
                  value={brief.venue.map_link}
                  onChange={(e) => patch("venue", { map_link: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              )}
            </FormField>
          </div>
        )}

        {/* Step 2 — categories & format */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <span className="text-[0.8125rem] text-text-muted">Quick add</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {STANDARD_CATEGORIES.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCategory(c)}
                  >
                    <Plus aria-hidden /> {c}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {brief.categories.map((c, i) => (
                <div key={i} className="rounded-md border bg-surface p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={c.label}
                      onChange={(e) => updateCategory(i, "label", e.target.value)}
                      placeholder="Category name"
                      className="font-medium"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCategory(i)}
                      aria-label="Remove category"
                    >
                      <X aria-hidden />
                    </Button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <Input
                      value={c.skill_or_age_bracket}
                      onChange={(e) => updateCategory(i, "skill_or_age_bracket", e.target.value)}
                      placeholder="Skill / age (e.g. 3.5+)"
                    />
                    <Input
                      value={c.entry_fee}
                      onChange={(e) => updateCategory(i, "entry_fee", e.target.value)}
                      placeholder="Entry fee (e.g. ₹799)"
                    />
                    <Input
                      value={c.max_slots}
                      onChange={(e) => updateCategory(i, "max_slots", e.target.value)}
                      placeholder="Max slots"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addCategory()}>
                <Plus aria-hidden /> Add custom category
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Format">
                {(p) => (
                  <select
                    {...p}
                    className={selectClass}
                    value={brief.format.structure}
                    onChange={(e) =>
                      patch("format", { structure: e.target.value as FormatStructure })
                    }
                  >
                    {FORMAT_STRUCTURES.map((f) => (
                      <option key={f} value={f}>
                        {FORMAT_STRUCTURE_LABELS[f]}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
              <FormField label="Ball type">
                {(p) => (
                  <Input
                    {...p}
                    value={brief.format.ball_type}
                    onChange={(e) => patch("format", { ball_type: e.target.value })}
                    placeholder="Outdoor / indoor"
                  />
                )}
              </FormField>
            </div>
            <FormField label="Format notes">
              {(p) => (
                <Textarea
                  {...p}
                  value={brief.format.notes}
                  onChange={(e) => patch("format", { notes: e.target.value })}
                  placeholder="Best of 3 to 11, win by 2."
                  rows={2}
                />
              )}
            </FormField>
          </div>
        )}

        {/* Step 3 — prizes & sponsors */}
        {step === 3 && (
          <div className="space-y-4">
            <FormField label="Prize pool">
              {(p) => (
                <Input
                  {...p}
                  value={brief.prizes.prize_pool}
                  onChange={(e) => patch("prizes", { prize_pool: e.target.value })}
                  placeholder="₹1,00,000"
                />
              )}
            </FormField>
            <FormField label="Breakdown">
              {(p) => (
                <Textarea
                  {...p}
                  value={brief.prizes.breakdown}
                  onChange={(e) => patch("prizes", { breakdown: e.target.value })}
                  placeholder="Winner ₹50k, runner-up ₹25k per category."
                  rows={2}
                />
              )}
            </FormField>
            <FormField label="Trophies or perks">
              {(p) => (
                <Input
                  {...p}
                  value={brief.prizes.trophies_or_perks}
                  onChange={(e) => patch("prizes", { trophies_or_perks: e.target.value })}
                  placeholder="Medals, hampers, pro-shop vouchers"
                />
              )}
            </FormField>

            <div className="space-y-3 pt-2">
              <span className="text-[0.8125rem] text-text-muted">Sponsors</span>
              {brief.sponsors.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border bg-surface p-2">
                  <Input
                    value={s.name}
                    onChange={(e) => updateSponsor(i, { name: e.target.value })}
                    placeholder="Sponsor name"
                    className="min-w-40 flex-1"
                  />
                  <Input
                    value={s.tier}
                    onChange={(e) => updateSponsor(i, { tier: e.target.value })}
                    placeholder="Tier (title / gold…)"
                    className="w-40"
                  />
                  <label className="flex items-center gap-1.5 text-[0.8125rem] text-text-muted">
                    <Checkbox
                      checked={s.logo_provided}
                      onCheckedChange={(v) => updateSponsor(i, { logo_provided: Boolean(v) })}
                    />
                    Logo
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSponsor(i)}
                    aria-label="Remove sponsor"
                  >
                    <X aria-hidden />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSponsor}>
                <Plus aria-hidden /> Add sponsor
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — registration */}
        {step === 4 && (
          <div className="space-y-4">
            <FormField label="How to register" helper="Plain steps a player can follow.">
              {(p) => (
                <Textarea
                  {...p}
                  value={brief.registration.how_to_register}
                  onChange={(e) => patch("registration", { how_to_register: e.target.value })}
                  placeholder="Register online, pay the entry fee, and you're in."
                  rows={3}
                />
              )}
            </FormField>
            <FormField
              label="External registration link"
              helper="We link out to whatever you already use. We don't process payments."
            >
              {(p) => (
                <Input
                  {...p}
                  value={brief.registration.external_link}
                  onChange={(e) => patch("registration", { external_link: e.target.value })}
                  placeholder="https://forms.gle/..."
                />
              )}
            </FormField>
            <FormField label="Fee / payment note">
              {(p) => (
                <Input
                  {...p}
                  value={brief.registration.fee_payment_note}
                  onChange={(e) => patch("registration", { fee_payment_note: e.target.value })}
                  placeholder="Pay via UPI on registration."
                />
              )}
            </FormField>
          </div>
        )}

        {/* Step 5 — branding */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Primary color" helper="Drives the whole visual identity.">
                {(p) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Primary color"
                      value={/^#[0-9a-fA-F]{6}$/.test(brief.branding.primary_color) ? brief.branding.primary_color : "#f16c1d"}
                      onChange={(e) => patch("branding", { primary_color: e.target.value })}
                      className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent"
                    />
                    <Input
                      {...p}
                      value={brief.branding.primary_color}
                      onChange={(e) => patch("branding", { primary_color: e.target.value })}
                      placeholder="#F16C1D (optional)"
                    />
                  </div>
                )}
              </FormField>
              <FormField label="Secondary color">
                {(p) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Secondary color"
                      value={/^#[0-9a-fA-F]{6}$/.test(brief.branding.secondary_color) ? brief.branding.secondary_color : "#121212"}
                      onChange={(e) => patch("branding", { secondary_color: e.target.value })}
                      className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent"
                    />
                    <Input
                      {...p}
                      value={brief.branding.secondary_color}
                      onChange={(e) => patch("branding", { secondary_color: e.target.value })}
                      placeholder="#121212 (optional)"
                    />
                  </div>
                )}
              </FormField>
            </div>

            <div className="space-y-1.5">
              <span className="text-[0.8125rem] text-text-muted">Logo (optional)</span>
              <div className="flex items-center gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-2">
                  {brief.branding.logo_url ? (
                    <Image
                      src={brief.branding.logo_url}
                      alt="Logo"
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
                    const f = e.target.files?.[0];
                    if (f) void uploadLogo(f);
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
                  ) : brief.branding.logo_url ? (
                    "Replace logo"
                  ) : (
                    "Upload logo"
                  )}
                </Button>
              </div>
            </div>

            <FormField label="Tone">
              {(p) => (
                <select
                  {...p}
                  className={selectClass}
                  value={brief.branding.tone}
                  onChange={(e) => patch("branding", { tone: e.target.value as Tone })}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </div>
        )}

        {/* Step 6 — marketing & organizer */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[0.8125rem] text-text-muted">Marketing channels</span>
              <div className="flex flex-wrap gap-3">
                {MARKETING_CHANNELS.map((ch) => (
                  <label
                    key={ch}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm capitalize",
                      brief.marketing.channels.includes(ch) && "border-orange bg-orange-050"
                    )}
                  >
                    <Checkbox
                      checked={brief.marketing.channels.includes(ch)}
                      onCheckedChange={() => toggleChannel(ch)}
                    />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Target audience">
                {(p) => (
                  <Input
                    {...p}
                    value={brief.marketing.target_audience}
                    onChange={(e) => patch("marketing", { target_audience: e.target.value })}
                    placeholder="Club players, 18 to 45"
                  />
                )}
              </FormField>
              <FormField label="Region for outreach" helper="Defaults to your city.">
                {(p) => (
                  <Input
                    {...p}
                    value={brief.marketing.region_for_outreach}
                    onChange={(e) => patch("marketing", { region_for_outreach: e.target.value })}
                    placeholder="Tamil Nadu"
                  />
                )}
              </FormField>
            </div>

            <div className="border-t pt-4">
              <span className="text-[0.8125rem] text-text-muted">Organizer & contact</span>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <FormField label="Organisation name">
                  {(p) => (
                    <Input
                      {...p}
                      value={brief.organizer.org_name}
                      onChange={(e) => patch("organizer", { org_name: e.target.value })}
                      placeholder="RizzFitt Sports Club"
                    />
                  )}
                </FormField>
                <FormField label="Contact name">
                  {(p) => (
                    <Input
                      {...p}
                      value={brief.organizer.contact_name}
                      onChange={(e) => patch("organizer", { contact_name: e.target.value })}
                      placeholder="Asha Menon"
                    />
                  )}
                </FormField>
                <FormField label="Email">
                  {(p) => (
                    <Input
                      {...p}
                      type="email"
                      value={brief.organizer.email}
                      onChange={(e) => patch("organizer", { email: e.target.value })}
                      placeholder="hello@rizzfitt.com"
                    />
                  )}
                </FormField>
                <FormField label="Phone">
                  {(p) => (
                    <Input
                      {...p}
                      value={brief.organizer.phone}
                      onChange={(e) => patch("organizer", { phone: e.target.value })}
                      placeholder="+91 98000 00000"
                    />
                  )}
                </FormField>
              </div>
              <FormField label="Website or socials" className="mt-4" helper="Comma-separated links.">
                {(p) => (
                  <Input
                    {...p}
                    value={brief.organizer.website_or_socials.join(", ")}
                    onChange={(e) =>
                      patch("organizer", {
                        website_or_socials: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="instagram.com/rizzfitt, rizzfitt.com"
                  />
                )}
              </FormField>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || busy}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={busy || uploading}>
              {busy ? "Generating brief…" : "Create brief"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
