/**
 * The Tournament Brief — the backbone object (MVP build prompt §6).
 * Everything downstream (landing page, email, marketing) reads from this.
 * Fields mirror §6 exactly. Anything blank must degrade gracefully, never
 * break generation, so most fields are optional strings that default to "".
 */
import { z } from "zod";

/** Standard pickleable pickleball categories (§6). */
export const STANDARD_CATEGORIES = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
] as const;

/** Format structures — feeds the eventual handoff to Rizzfitt scoring (§6). */
export const FORMAT_STRUCTURES = [
  "round_robin",
  "single_knockout",
  "double_knockout",
  "pool_plus_knockout",
] as const;
export type FormatStructure = (typeof FORMAT_STRUCTURES)[number];

export const FORMAT_STRUCTURE_LABELS: Record<FormatStructure, string> = {
  round_robin: "Round robin",
  single_knockout: "Single knockout",
  double_knockout: "Double knockout",
  pool_plus_knockout: "Pool plus knockout",
};

export const TONES = [
  "energetic_and_competitive",
  "friendly_and_community",
  "premium_and_pro",
] as const;
export type Tone = (typeof TONES)[number];

const categorySchema = z.object({
  label: z.string().default(""),
  skill_or_age_bracket: z.string().default(""),
  entry_fee: z.string().default(""),
  max_slots: z.string().default(""),
});

const sponsorSchema = z.object({
  name: z.string().default(""),
  tier: z.string().default(""),
  logo_provided: z.boolean().default(false),
});

export const briefSchema = z.object({
  identity: z.object({
    name: z.string().default(""),
    tagline: z.string().default(""),
    sport: z.string().default("pickleball"),
    edition: z.string().default(""),
    year: z.string().default(""),
  }),
  organizer: z.object({
    org_name: z.string().default(""),
    contact_name: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    website_or_socials: z.array(z.string()).default([]),
  }),
  dates: z.object({
    start_date: z.string().default(""),
    end_date: z.string().default(""),
    registration_deadline: z.string().default(""),
  }),
  venue: z.object({
    name: z.string().default(""),
    address: z.string().default(""),
    city: z.string().default(""),
    map_link: z.string().default(""),
  }),
  categories: z.array(categorySchema).default([]),
  format: z.object({
    structure: z.enum(FORMAT_STRUCTURES).default("pool_plus_knockout"),
    ball_type: z.string().default(""),
    notes: z.string().default(""),
  }),
  prizes: z.object({
    prize_pool: z.string().default(""),
    breakdown: z.string().default(""),
    trophies_or_perks: z.string().default(""),
  }),
  sponsors: z.array(sponsorSchema).default([]),
  registration: z.object({
    how_to_register: z.string().default(""),
    external_link: z.string().default(""),
    fee_payment_note: z.string().default(""),
  }),
  branding: z.object({
    primary_color: z.string().default(""),
    secondary_color: z.string().default(""),
    logo_provided: z.boolean().default(false),
    logo_url: z.string().default(""), // stored logo (extends §6 for real uploads)
    tone: z.enum(TONES).default("energetic_and_competitive"),
  }),
  marketing: z.object({
    channels: z.array(z.string()).default(["email", "instagram", "whatsapp"]),
    target_audience: z.string().default(""),
    region_for_outreach: z.string().default(""),
  }),
});

export type TournamentBrief = z.infer<typeof briefSchema>;
export type BriefCategory = z.infer<typeof categorySchema>;
export type BriefSponsor = z.infer<typeof sponsorSchema>;

/** A fully-defaulted empty Brief (the form binds to this). */
export function emptyBrief(): TournamentBrief {
  return briefSchema.parse({
    identity: {},
    organizer: {},
    dates: {},
    venue: {},
    format: {},
    prizes: {},
    registration: {},
    branding: {},
    marketing: {},
  });
}

/**
 * The only hard-required fields (§7): tournament name, dates, and city —
 * so an organizer can generate something useful from very little.
 */
export const briefRequiredSchema = z.object({
  identity: z.object({ name: z.string().trim().min(2, "Tournament name is required") }),
  dates: z.object({ start_date: z.string().trim().min(1, "A start date is required") }),
  venue: z.object({ city: z.string().trim().min(1, "City is required") }),
});

export function validateRequired(brief: TournamentBrief): string[] {
  const res = briefRequiredSchema.safeParse(brief);
  if (res.success) return [];
  return res.error.issues.map((i) => i.message);
}
