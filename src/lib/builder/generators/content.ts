/**
 * Email, Marketing, and Contacts generators + the master LLM prompt
 * (MVP build prompt §8.2 / §8.3). Deterministic and template-first so real
 * output exists with no AI key; the master prompt is what to paste into an
 * LLM for a richer pass. Copy rules §11: "to" for ranges, no em dashes,
 * never fabricate (empty facts are omitted).
 */
import type { GenerationSpec } from "../generation-spec";
import { renderSpecText } from "../generation-spec";

export interface EmailTemplate {
  key: string;
  label: string;
  subject: string;
  body: string;
}

export interface MarketingKit {
  instagramCaptions: string[];
  posterHooks: string[];
  whatsappBlurb: string;
  standardDescription: string;
}

export interface ContactSuggestion {
  name: string;
  role: string;
  channel: string;
  source: string;
  confidence: "high" | "medium" | "low";
}

const j = (parts: Array<string | false | undefined>, sep = " ") =>
  parts.filter(Boolean).join(sep);

/** One reusable, honest paragraph describing the event (no fabrication). */
export function standardDescription(spec: GenerationSpec): string {
  const t = spec.tournament;
  const where = j([spec.where.venue, spec.where.city], ", ");
  const lines = [
    j([
      t.name || "This tournament",
      t.tagline ? `- ${t.tagline}.` : "is coming up.",
    ]),
    j([
      spec.when.dateRange ? `It runs ${spec.when.dateRange}` : "",
      where ? `at ${where}` : "",
    ]) + (spec.when.dateRange || where ? "." : ""),
    spec.categories.length
      ? `Categories: ${spec.categories.map((c) => c.label).join(", ")}.`
      : "",
    spec.when.registrationDeadline
      ? `Register by ${spec.when.registrationDeadline}.`
      : "",
  ].filter(Boolean);
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

export function generateEmails(spec: GenerationSpec, siteUrl?: string): EmailTemplate[] {
  const t = spec.tournament;
  const name = t.name || "our tournament";
  const link = siteUrl ? `\n\nFull details and registration: ${siteUrl}` : "";
  const cats = spec.categories.length
    ? `\n\nCategories:\n${spec.categories.map((c) => `- ${c.label}${c.fee ? ` (${c.fee})` : ""}`).join("\n")}`
    : "";
  const when = spec.when.dateRange ? ` on ${spec.when.dateRange}` : "";
  const where = spec.where.city ? ` in ${spec.where.city}` : "";
  const deadline = spec.when.registrationDeadline
    ? `\n\nRegistration closes ${spec.when.registrationDeadline}, so grab your spot early.`
    : "";

  return [
    {
      key: "announcement",
      label: "Announcement",
      subject: `${name} is here${when ? `, ${spec.when.dateRange}` : ""}`,
      body: j(
        [
          `Hi there,`,
          `We are excited to announce ${name}${when}${where}.`,
          t.tagline ? `${t.tagline}.` : "",
          cats,
          deadline,
          link,
          `See you on court,\nThe ${name} team`,
        ],
        "\n\n"
      ).trim(),
    },
    {
      key: "call_for_players",
      label: "Call for players",
      subject: `Spots are open for ${name}`,
      body: j(
        [
          `Hi there,`,
          `Registration is now open for ${name}${when}${where}. Whether you play for fun or to win, there is a category for you.`,
          cats,
          deadline,
          link || `\n\nReply to this email and we will send you the registration details.`,
          `Bring your paddle and a friend,\nThe ${name} team`,
        ],
        "\n\n"
      ).trim(),
    },
    {
      key: "reminder",
      label: "Reminder",
      subject: `Last call: register for ${name}`,
      body: j(
        [
          `Hi there,`,
          `A quick reminder that ${name}${when} is almost here${spec.when.registrationDeadline ? ` and registration closes ${spec.when.registrationDeadline}` : ""}.`,
          `If you have been meaning to sign up, now is the time.`,
          link,
          `See you there,\nThe ${name} team`,
        ],
        "\n\n"
      ).trim(),
    },
  ];
}

export function generateMarketing(spec: GenerationSpec, siteUrl?: string): MarketingKit {
  const t = spec.tournament;
  const name = t.name || "our tournament";
  const when = spec.when.dateRange || "";
  const city = spec.where.city || "";
  const tag = spec.tournament.tagline;
  const link = siteUrl ? ` ${siteUrl}` : "";
  const hashtags = j(
    ["#pickleball", city && `#${city.replace(/\s+/g, "")}`, "#tournament"],
    " "
  );

  return {
    instagramCaptions: [
      j([`${name} is on${when ? ` this ${when}` : ""}${city ? ` in ${city}` : ""}.`, tag && `${tag}.`, "Tag your doubles partner and lock it in.", link, hashtags], " ").trim(),
      j([`Game on. ${name}${city ? ` comes to ${city}` : ""}.`, "Singles, doubles, every level. Which category are you entering?", link, hashtags], " ").trim(),
    ],
    posterHooks: [
      name.toUpperCase(),
      tag || (when ? `${when}${city ? ` · ${city}` : ""}` : "Register now"),
    ],
    whatsappBlurb: j(
      [
        `🏓 *${name}*`,
        j([when && `📅 ${when}`, city && `📍 ${city}`], "  ").trim(),
        tag || "All skill levels welcome.",
        spec.when.registrationDeadline ? `Register by ${spec.when.registrationDeadline}.` : "Spots are limited.",
        siteUrl ? `👉 ${siteUrl}` : "",
      ].filter(Boolean),
      "\n"
    ).trim(),
    standardDescription: standardDescription(spec),
  };
}

/**
 * Contact discovery is not wired to a live data source in this build, so we
 * return honest, clearly-labeled SUGGESTED outreach targets (the kinds of
 * groups to contact in the region) rather than fabricated people. §8.2:
 * never present invented contacts as real.
 */
export function generateContacts(spec: GenerationSpec): {
  note: string;
  suggestions: ContactSuggestion[];
} {
  const region = spec.marketing.region || spec.where.city || "your region";
  const mk = (name: string, role: string): ContactSuggestion => ({
    name,
    role,
    channel: "Search required (not connected to a live directory yet)",
    source: "suggested outreach type",
    confidence: "low",
  });
  return {
    note: `Live contact discovery is not connected yet, so these are suggested outreach TYPES to find in ${region}, not real contacts. Nothing here is fabricated as a real person.`,
    suggestions: [
      mk(`Pickleball clubs in ${region}`, "Community hubs with active players"),
      mk(`Racquet / sports academies in ${region}`, "Coaches and student players"),
      mk(`State / city pickleball association`, "Official channels and mailing lists"),
      mk(`Local gyms and fitness studios`, "Fitness communities open to racquet sport"),
      mk(`Past participants (your own list)`, "Highest intent - import your CSV"),
    ],
  };
}

/**
 * The master prompt: what to paste into any LLM (Claude, ChatGPT) to
 * generate a richer version of everything. This is the "at least generate
 * the prompt" fallback when no AI key is configured.
 */
export function buildMasterPrompt(spec: GenerationSpec, siteUrl?: string): string {
  return [
    `You are a senior marketing copywriter and web designer for grassroots sport.`,
    `Using ONLY the tournament facts below, produce:`,
    `1. A single-page tournament website (HTML), mobile-first, using the brand colors.`,
    `2. Three emails: an announcement, a call-for-players, and a reminder.`,
    `3. A marketing kit: 3 Instagram captions, 2 poster hooks, 1 WhatsApp broadcast, and 1 reusable description.`,
    ``,
    `Rules: never invent facts. If a field is empty, leave that section out.`,
    `Write ranges with the word "to". Do not use em dashes. Keep the tone confident, warm, and community-facing.`,
    siteUrl ? `Link to this registration/info page where relevant: ${siteUrl}` : ``,
    ``,
    `--- TOURNAMENT FACTS ---`,
    renderSpecText(spec),
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}
