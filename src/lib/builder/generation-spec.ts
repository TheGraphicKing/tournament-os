/**
 * Synthesis — Pass 1 (MVP build prompt §4).
 * Turns the canonical Tournament Brief into a clean, self-contained
 * Generation Spec that the three downstream agents (landing page, email,
 * marketing) consume. This is the "turn the inputs into a prompt" step.
 *
 * The form path is deterministic (no LLM needed). The Spec carries a
 * resolved palette, a normalized set of facts with empties dropped, and the
 * non-negotiable copy rules (§11) so every generator obeys them.
 */
import type { TournamentBrief } from "./brief";
import { FORMAT_STRUCTURE_LABELS } from "./brief";
import { resolvePalette, type ResolvedPalette } from "./palette";

/** Copy rules every generator must obey (§11). */
export const COPY_RULES = [
  "Write in a confident, warm, community-facing tone. This is grassroots sport, not corporate.",
  "Never invent facts. If a field is empty, omit that section gracefully rather than filling it with a placeholder or made-up figure.",
  'Write ranges with the word "to", for example "9 AM to 5 PM".',
  "Do not use em dashes anywhere. Use periods, commas, colons, or hyphens.",
] as const;

export interface GenerationSpec {
  tournament: {
    name: string;
    tagline: string;
    sport: string;
    edition: string;
    year: string;
    oneLiner: string;
  };
  when: { dateRange: string; registrationDeadline: string };
  where: { venue: string; address: string; city: string; mapLink: string };
  organizer: {
    orgName: string;
    contactName: string;
    email: string;
    phone: string;
    socials: string[];
  };
  categories: Array<{ label: string; bracket: string; fee: string; slots: string }>;
  format: { structure: string; ballType: string; notes: string };
  prizes: { pool: string; breakdown: string; perks: string };
  sponsors: Array<{ name: string; tier: string; logoProvided: boolean }>;
  registration: { how: string; link: string; feeNote: string };
  branding: { palette: ResolvedPalette; tone: string; logoProvided: boolean; logoUrl: string };
  marketing: { channels: string[]; audience: string; region: string };
  copyRules: readonly string[];
}

const clean = (s: string) => s.trim();
const has = (s: string) => clean(s).length > 0;

/** "18 Jul 2026 to 19 Jul 2026" or a single date, using "to" per §11. */
function formatDateRange(start: string, end: string): string {
  if (!has(start)) return "";
  if (!has(end) || clean(end) === clean(start)) return clean(start);
  return `${clean(start)} to ${clean(end)}`;
}

function humanTone(tone: string): string {
  return tone.replace(/_/g, " ");
}

export function buildGenerationSpec(brief: TournamentBrief): GenerationSpec {
  const { identity, organizer, dates, venue, format, prizes, registration, branding, marketing } =
    brief;

  const oneLinerParts = [
    has(identity.name) ? identity.name : "This tournament",
    has(venue.city) ? `in ${clean(venue.city)}` : "",
    formatDateRange(dates.start_date, dates.end_date)
      ? `on ${formatDateRange(dates.start_date, dates.end_date)}`
      : "",
  ].filter(has);

  return {
    tournament: {
      name: clean(identity.name),
      tagline: clean(identity.tagline),
      sport: clean(identity.sport) || "pickleball",
      edition: clean(identity.edition),
      year: clean(identity.year),
      oneLiner: oneLinerParts.join(" "),
    },
    when: {
      dateRange: formatDateRange(dates.start_date, dates.end_date),
      registrationDeadline: clean(dates.registration_deadline),
    },
    where: {
      venue: clean(venue.name),
      address: clean(venue.address),
      city: clean(venue.city),
      mapLink: clean(venue.map_link),
    },
    organizer: {
      orgName: clean(organizer.org_name),
      contactName: clean(organizer.contact_name),
      email: clean(organizer.email),
      phone: clean(organizer.phone),
      socials: organizer.website_or_socials.map(clean).filter(has),
    },
    categories: brief.categories
      .filter((c) => has(c.label))
      .map((c) => ({
        label: clean(c.label),
        bracket: clean(c.skill_or_age_bracket),
        fee: clean(c.entry_fee),
        slots: clean(c.max_slots),
      })),
    format: {
      structure: FORMAT_STRUCTURE_LABELS[format.structure],
      ballType: clean(format.ball_type),
      notes: clean(format.notes),
    },
    prizes: {
      pool: clean(prizes.prize_pool),
      breakdown: clean(prizes.breakdown),
      perks: clean(prizes.trophies_or_perks),
    },
    sponsors: brief.sponsors
      .filter((s) => has(s.name))
      .map((s) => ({ name: clean(s.name), tier: clean(s.tier), logoProvided: s.logo_provided })),
    registration: {
      how: clean(registration.how_to_register),
      link: clean(registration.external_link),
      feeNote: clean(registration.fee_payment_note),
    },
    branding: {
      palette: resolvePalette(branding.primary_color, branding.secondary_color),
      tone: humanTone(branding.tone),
      logoProvided: branding.logo_provided,
      logoUrl: clean(branding.logo_url),
    },
    marketing: {
      channels: marketing.channels.filter(has),
      audience: clean(marketing.target_audience),
      region: clean(marketing.region_for_outreach) || clean(venue.city),
    },
    copyRules: COPY_RULES,
  };
}

/**
 * Render the Spec as a clean instruction block. This is what an LLM-backed
 * generator would receive as its prompt context; the deterministic
 * generators read the structured object directly. Empty facts are omitted
 * so nothing fabricated leaks in.
 */
export function renderSpecText(spec: GenerationSpec): string {
  const lines: string[] = [];
  const add = (label: string, value: string) => {
    if (has(value)) lines.push(`- ${label}: ${value.trim()}`);
  };

  lines.push(`# Generation spec: ${spec.tournament.name || "Untitled tournament"}`);
  lines.push("");
  lines.push("## Tournament");
  add("Name", spec.tournament.name);
  add("Tagline", spec.tournament.tagline);
  add("Sport", spec.tournament.sport);
  add("Edition", spec.tournament.edition);
  add("Year", spec.tournament.year);
  add("One-liner", spec.tournament.oneLiner);

  lines.push("");
  lines.push("## When and where");
  add("Dates", spec.when.dateRange);
  add("Registration deadline", spec.when.registrationDeadline);
  add("Venue", spec.where.venue);
  add("Address", spec.where.address);
  add("City", spec.where.city);
  add("Map", spec.where.mapLink);

  if (
    spec.organizer.orgName ||
    spec.organizer.contactName ||
    spec.organizer.email ||
    spec.organizer.phone ||
    spec.organizer.socials.length
  ) {
    lines.push("");
    lines.push("## Organizer & contact");
    add("Organisation", spec.organizer.orgName);
    add("Contact", spec.organizer.contactName);
    add("Email", spec.organizer.email);
    add("Phone", spec.organizer.phone);
    add("Socials", spec.organizer.socials.join(", "));
  }

  if (spec.categories.length) {
    lines.push("");
    lines.push("## Categories");
    for (const c of spec.categories) {
      const bits = [c.label, c.bracket, c.fee && `fee ${c.fee}`, c.slots && `${c.slots} slots`]
        .filter(Boolean)
        .join(", ");
      lines.push(`- ${bits}`);
    }
  }

  lines.push("");
  lines.push("## Format");
  add("Structure", spec.format.structure);
  add("Ball type", spec.format.ballType);
  add("Notes", spec.format.notes);

  if (spec.prizes.pool || spec.prizes.breakdown || spec.prizes.perks) {
    lines.push("");
    lines.push("## Prizes");
    add("Prize pool", spec.prizes.pool);
    add("Breakdown", spec.prizes.breakdown);
    add("Trophies or perks", spec.prizes.perks);
  }

  if (spec.sponsors.length) {
    lines.push("");
    lines.push("## Sponsors");
    for (const s of spec.sponsors) {
      lines.push(`- ${[s.name, s.tier].filter(Boolean).join(", ")}`);
    }
  }

  lines.push("");
  lines.push("## Registration");
  add("How to register", spec.registration.how);
  add("External link", spec.registration.link);
  add("Fee / payment note", spec.registration.feeNote);

  lines.push("");
  lines.push("## Branding");
  add("Accent", spec.branding.palette.accent + (spec.branding.palette.derived ? " (derived default)" : ""));
  add("Secondary", spec.branding.palette.secondary);
  add("Tone", spec.branding.tone);
  add("Logo provided", spec.branding.logoProvided ? "yes" : "no");

  lines.push("");
  lines.push("## Marketing");
  add("Channels", spec.marketing.channels.join(", "));
  add("Target audience", spec.marketing.audience);
  add("Region for outreach", spec.marketing.region);

  lines.push("");
  lines.push("## Copy rules (non-negotiable)");
  for (const r of spec.copyRules) lines.push(`- ${r}`);

  return lines.join("\n");
}
