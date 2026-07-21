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
  const p = spec.branding.palette;
  return [
    `# ROLE`,
    `You are an award-winning web designer and conversion copywriter who specialises in`,
    `grassroots sports events. You ship premium, modern, single-page event sites that look`,
    `hand-crafted, and marketing copy that a local community actually shares.`,
    ``,
    `# TASK`,
    `Using ONLY the tournament facts at the bottom, produce four deliverables:`,
    ``,
    `## 1. Landing page (single self-contained HTML file)`,
    `Build a website that looks like a senior product designer and a creative technologist shipped it together. Not a template. It should feel dynamic, alive, and high-agency.`,
    `- Self-contained: one HTML file, all CSS inline in <style>, all JS inline in <script>. External resources allowed: Google Fonts, and CDN libraries via <script src> or ES module import (e.g. three.js) ONLY if you actually use them well.`,
    `- Mobile-first and genuinely responsive. Must stay smooth (target 60fps); never block scroll.`,
    `- Theme strictly from these brand tokens: accent ${p.accent}, accent-pressed ${p.accentPress}, on-accent ${p.onAccent}, ink ${p.ink}, secondary ${p.secondary}. Build a full dark/light system around them. Enforce AA contrast.`,
    `- REQUIRED richness (use most of these, tastefully, never gratuitously):`,
    `  * A striking animated hero: a WebGL/three.js or canvas scene, or an animated gradient/aurora with parallax depth. Kinetic typography (staggered word/letter entrance).`,
    `  * At least one genuine 3D element (three.js object, or CSS 3D transforms with perspective) and pointer-reactive tilt/parallax on cards or the hero.`,
    `  * An interactive, on-theme mini-game or playful interaction (e.g. a pickleball rally/keep-it-up canvas game with score + best) that invites the visitor to engage. It must be lightweight, restartable, and work with mouse and touch.`,
    `  * Scroll-driven animation: reveal-on-scroll, count-up stats, a scroll progress indicator, section transitions.`,
    `  * Micro-interactions on every interactive element (hover, focus, press) with easing that feels crafted.`,
    `- Illustrative, not stocky: generate inline SVG illustrations/icons/patterns and decorative shapes yourself. Do not hotlink random images. If a logo URL is provided, use it in the header.`,
    `- Structure (omit sections with no data): sticky header with nav + register CTA and a scroll progress bar; hero; animated stat band (count-up); an "at a glance" detail strip; categories as 3D-tilt cards with fee badges; the interactive mini-game; format; prizes with a large animated prize figure; sponsors grouped by tier; a bold "how to register" CTA band; a rich footer (organiser, contact, socials, map).`,
    `- Typography: pair an expressive display face (Space Grotesk, Clash Display, Sora, or similar) with a clean body (Inter). Big, confident type. Deliberate numerals.`,
    `- Accessibility and taste: keyboard-operable, visible focus, semantic HTML. Respect prefers-reduced-motion by disabling ambient motion and the game's autoplay. No autoplaying sound.`,
    `- The primary call to action is "Register" and must link to the registration URL if present; otherwise show a clear "opening soon" state.`,
    `- Bar to clear: if it looks like a generic Bootstrap page, start over. Aim for something an organiser would proudly share as their real event site.`,
    ``,
    `## 2. Emails (plain text, ready to paste)`,
    `Announcement, call-for-players, and reminder. Each: a punchy subject line and a short body`,
    `(under 120 words) that states the essentials and drives to the register link.`,
    ``,
    `## 3. Marketing kit`,
    `3 Instagram captions (each with 3 to 5 relevant hashtags), 2 poster/story hooks (max 6 words),`,
    `1 WhatsApp broadcast (with light emoji, scannable), and 1 reusable one-paragraph description.`,
    ``,
    `## 4. A short "what I assumed / what is missing" note`,
    `List any facts that were blank so the organiser knows what to add for a stronger result.`,
    ``,
    `# HARD RULES`,
    `- Never invent facts (no fake dates, prices, sponsors, or quotes). If a field is empty, omit that section entirely.`,
    `- Write ranges with the word "to" (e.g. "9 AM to 5 PM"). Never use em dashes; use commas, periods, or colons.`,
    `- Tone: confident, warm, community-facing. Not corporate.`,
    siteUrl ? `- Where a link is needed, use: ${siteUrl}` : `- If no registration link exists, add a clear "registration opening soon" note instead of a dead button.`,
    `- Output each deliverable in its own clearly labelled section. Put the landing page HTML in one fenced \`\`\`html block.`,
    ``,
    `# TOURNAMENT FACTS`,
    renderSpecText(spec),
  ].join("\n");
}
