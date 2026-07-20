/**
 * Landing Page generator (MVP build prompt §8.1) — turns the Generation
 * Spec into a complete, self-contained, mobile-first HTML tournament site,
 * themed from the organiser's palette. Deterministic (no LLM needed);
 * empty sections are omitted (never fabricate). Copy rules §11: ranges use
 * "to", no em dashes.
 */
import type { GenerationSpec } from "../generation-spec";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeUrl(u: string): string | null {
  const v = u.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.-]+\.\w{2,}(\/|$)/.test(v)) return "https://" + v; // bare domain
  return null;
}

export function renderLandingHtml(spec: GenerationSpec): string {
  const p = spec.branding.palette;
  const t = spec.tournament;
  const regLink = safeUrl(spec.registration.link);

  const detailItems: Array<[string, string]> = [];
  if (spec.when.dateRange) detailItems.push(["Dates", spec.when.dateRange]);
  if (spec.where.venue) detailItems.push(["Venue", spec.where.venue]);
  if (spec.where.city) detailItems.push(["City", spec.where.city]);
  if (spec.format.structure) detailItems.push(["Format", spec.format.structure]);
  if (spec.when.registrationDeadline)
    detailItems.push(["Register by", spec.when.registrationDeadline]);

  const detailsHtml = detailItems.length
    ? `<section class="details"><div class="wrap grid">${detailItems
        .map(
          ([k, v]) =>
            `<div class="detail"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`
        )
        .join("")}</div></section>`
    : "";

  const categoriesHtml = spec.categories.length
    ? `<section id="categories" class="section"><div class="wrap">
        <h2>Categories</h2>
        <div class="cards">${spec.categories
          .map((c) => {
            const meta = [c.bracket, c.slots ? `${esc(c.slots)} slots` : ""]
              .filter(Boolean)
              .map(esc)
              .join(" · ");
            return `<div class="card">
              <h3>${esc(c.label)}</h3>
              ${meta ? `<p class="muted">${meta}</p>` : ""}
              ${c.fee ? `<p class="fee">${esc(c.fee)}</p>` : `<p class="fee free">Free</p>`}
            </div>`;
          })
          .join("")}</div></div></section>`
    : "";

  const prizesHtml =
    spec.prizes.pool || spec.prizes.breakdown || spec.prizes.perks
      ? `<section class="section alt"><div class="wrap">
          <h2>Prizes</h2>
          ${spec.prizes.pool ? `<p class="prizepool">${esc(spec.prizes.pool)}</p>` : ""}
          ${spec.prizes.breakdown ? `<p>${esc(spec.prizes.breakdown)}</p>` : ""}
          ${spec.prizes.perks ? `<p class="muted">${esc(spec.prizes.perks)}</p>` : ""}
        </div></section>`
      : "";

  const sponsorsHtml = spec.sponsors.length
    ? `<section class="section"><div class="wrap">
        <h2>Sponsors</h2>
        <div class="sponsors">${spec.sponsors
          .map((s) => `<span class="sponsor">${esc(s.name)}${s.tier ? ` <em>${esc(s.tier)}</em>` : ""}</span>`)
          .join("")}</div></div></section>`
    : "";

  const howItems = [
    spec.registration.how,
    spec.registration.feeNote,
  ].filter(Boolean);
  const registerHtml = `<section id="register" class="section register"><div class="wrap">
      <h2>How to register</h2>
      ${howItems.map((h) => `<p>${esc(h)}</p>`).join("")}
      ${
        regLink
          ? `<a class="btn big" href="${esc(regLink)}" target="_blank" rel="noopener">Register now</a>`
          : `<p class="muted">Registration link coming soon.</p>`
      }
    </div></section>`;

  const socials = spec.branding.logoUrl ? [] : []; // reserved
  void socials;

  const footerBits = [spec.tournament.name].filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(t.name || "Tournament")}</title>
<meta name="description" content="${esc(t.oneLiner || t.name)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root{
    --accent:${p.accent};--press:${p.accentPress};--ink:${p.ink};
    --surface:${p.surface};--on:${p.onAccent};--sec:${p.secondary};
    --muted:#6b635b;--border:#e7e4de;--bg:#faf9f7;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55}
  h1,h2,h3{font-family:"Space Grotesk",Inter,sans-serif;line-height:1.1}
  .wrap{max-width:960px;margin:0 auto;padding:0 20px}
  a{color:inherit}
  .hero{background:linear-gradient(135deg,var(--accent),var(--press));color:var(--on);padding:80px 0 72px;text-align:center}
  .hero .badge{display:inline-block;font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;border:1px solid rgba(255,255,255,.4);padding:5px 12px;border-radius:999px;margin-bottom:18px}
  .hero h1{font-size:clamp(2.2rem,6vw,4rem);font-weight:700}
  .hero .tag{font-size:clamp(1rem,2.4vw,1.35rem);margin-top:14px;opacity:.95}
  .hero .meta{margin-top:20px;font-weight:500;opacity:.95}
  .btn{display:inline-block;background:var(--on);color:var(--press);font-weight:600;padding:13px 26px;border-radius:10px;text-decoration:none;margin-top:26px;transition:transform .15s}
  .btn:hover{transform:translateY(-1px)}
  .btn.big{font-size:1.05rem;padding:15px 34px}
  .section{padding:56px 0}.section.alt{background:#fff}
  .section h2{font-size:clamp(1.5rem,3.5vw,2rem);margin-bottom:24px}
  .details{background:#fff;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
  .details .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px;padding:28px 20px}
  .detail{display:flex;flex-direction:column;gap:3px}
  .detail .k{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  .detail .v{font-weight:600}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
  .card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:20px}
  .card h3{font-size:1.15rem}
  .card .muted{color:var(--muted);font-size:.9rem;margin-top:4px}
  .card .fee{margin-top:12px;font-weight:700;color:var(--press);font-size:1.1rem}
  .card .fee.free{color:#1fa971}
  .prizepool{font-family:"Space Grotesk";font-size:2rem;font-weight:700;color:var(--press)}
  .sponsors{display:flex;flex-wrap:wrap;gap:12px}
  .sponsor{background:#fff;border:1px solid var(--border);border-radius:10px;padding:10px 16px;font-weight:600}
  .sponsor em{color:var(--muted);font-style:normal;font-weight:500;font-size:.85rem;text-transform:uppercase}
  .register{background:linear-gradient(135deg,var(--accent),var(--press));color:var(--on);text-align:center}
  .register .muted{opacity:.85}
  .muted{color:var(--muted)}
  footer{padding:40px 0;text-align:center;color:var(--muted);font-size:.9rem;border-top:1px solid var(--border)}
  p+p{margin-top:10px}
</style>
</head>
<body>
  <header class="hero"><div class="wrap">
    ${t.edition || t.year ? `<span class="badge">${esc([t.edition, t.year].filter(Boolean).join(" · "))}</span>` : ""}
    <h1>${esc(t.name || "Your Tournament")}</h1>
    ${t.tagline ? `<p class="tag">${esc(t.tagline)}</p>` : ""}
    ${
      spec.when.dateRange || spec.where.city
        ? `<p class="meta">${esc([spec.when.dateRange, spec.where.city].filter(Boolean).join(" · "))}</p>`
        : ""
    }
    ${regLink ? `<a class="btn" href="${esc(regLink)}" target="_blank" rel="noopener">Register now</a>` : ""}
  </div></header>
  ${detailsHtml}
  ${categoriesHtml}
  ${prizesHtml}
  ${sponsorsHtml}
  ${registerHtml}
  <footer><div class="wrap">
    <p>${esc(footerBits.join(" · ") || "Tournament")}</p>
    <p>Built with Rizzfitt Tournament Builder</p>
  </div></footer>
</body>
</html>`;
}
