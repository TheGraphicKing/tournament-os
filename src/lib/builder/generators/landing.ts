/**
 * Landing Page generator (MVP build prompt §8.1) — turns the Generation
 * Spec into a complete, self-contained, mobile-first HTML tournament site
 * themed from the organiser's palette. Deterministic (no LLM needed);
 * empty sections are omitted (never fabricate). Copy rules §11: ranges use
 * "to", no em dashes.
 *
 * This is a showpiece template: animated aurora + floating-ball canvas
 * hero, kinetic headline, count-up stats, 3D tilt category cards, a scroll
 * progress bar, and an interactive pickleball rally mini-game. All vanilla
 * (inline CSS + JS + canvas), no external deps except Google Fonts. Heavy
 * motion is disabled under prefers-reduced-motion.
 *
 * NOTE for maintainers: the inline <script> lives inside this JS template
 * literal, so it must contain NO backticks and NO "${" sequences.
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
  if (/^mailto:|^tel:/i.test(v)) return v;
  if (/^[\w.-]+\.\w{2,}(\/|$)/.test(v)) return "https://" + v;
  return null;
}

function socialLabel(u: string): string {
  const m = u.replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (/instagram/i.test(u)) return "Instagram";
  if (/facebook/i.test(u)) return "Facebook";
  if (/twitter|x\.com/i.test(u)) return "X";
  if (/youtube/i.test(u)) return "YouTube";
  if (/wa\.me|whatsapp/i.test(u)) return "WhatsApp";
  return m.split("/")[0];
}

const TIER_ORDER = ["title", "gold", "silver", "partner"];

const intOf = (s: string) => parseInt((s || "").replace(/[^\d]/g, ""), 10) || 0;

export function renderLandingHtml(spec: GenerationSpec): string {
  const p = spec.branding.palette;
  const t = spec.tournament;
  const org = spec.organizer;
  const regLink = safeUrl(spec.registration.link);
  const regHref = regLink ?? "#register";
  const logo = safeUrl(spec.branding.logoUrl);
  const brandName = t.name || org.orgName || "Tournament";

  const nav: Array<[string, string]> = [];
  if (spec.categories.length) nav.push(["categories", "Categories"]);
  nav.push(["rally", "Play"]);
  if (spec.prizes.pool || spec.prizes.breakdown || spec.prizes.perks) nav.push(["prizes", "Prizes"]);
  if (spec.sponsors.length) nav.push(["sponsors", "Sponsors"]);

  const chips = [spec.when.dateRange, spec.where.city, spec.format.structure].filter(Boolean);

  // Kinetic headline: split into words for staggered entrance.
  const headline = (t.name || "Your Tournament")
    .split(/\s+/)
    .map((w, i) => `<span class="word" style="--i:${i}">${esc(w)}</span>`)
    .join(" ");

  // Count-up stats (only those with real data).
  const totalSlots = spec.categories.reduce((n, c) => n + intOf(c.slots), 0);
  const prizeNum = intOf(spec.prizes.pool);
  const stats: Array<{ label: string; value: number; prefix?: string }> = [];
  if (spec.categories.length) stats.push({ label: "Categories", value: spec.categories.length });
  if (totalSlots > 0) stats.push({ label: "Player spots", value: totalSlots });
  if (prizeNum > 0) stats.push({ label: "Prize pool", value: prizeNum, prefix: "₹" });
  const statsHtml = stats.length
    ? `<section class="stats reveal"><div class="wrap stats-grid">${stats
        .map(
          (s) =>
            `<div class="stat"><span class="stat-num" data-count="${s.value}" data-prefix="${s.prefix ?? ""}">${s.prefix ?? ""}0</span><span class="stat-label">${esc(s.label)}</span></div>`
        )
        .join("")}</div></section>`
    : "";

  const details: Array<[string, string]> = [];
  if (spec.when.dateRange) details.push(["Dates", spec.when.dateRange]);
  if (spec.where.venue) details.push(["Venue", spec.where.venue]);
  if (spec.where.city) details.push(["City", spec.where.city]);
  if (spec.format.structure) details.push(["Format", spec.format.structure]);
  if (spec.format.ballType) details.push(["Ball", spec.format.ballType]);
  if (spec.when.registrationDeadline) details.push(["Register by", spec.when.registrationDeadline]);
  const detailsHtml = details.length
    ? `<section class="reveal"><div class="wrap glance">${details
        .map(
          ([k, v]) =>
            `<div class="glance-item"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`
        )
        .join("")}</div></section>`
    : "";

  const categoriesHtml = spec.categories.length
    ? `<section id="categories" class="section reveal"><div class="wrap">
        <div class="section-head"><span class="eyebrow">Compete</span><h2>Categories</h2></div>
        <div class="cards" data-tilt>${spec.categories
          .map((c) => {
            const meta = [c.bracket, c.slots ? `${esc(c.slots)} slots` : ""]
              .filter(Boolean)
              .map(esc)
              .join(" &middot; ");
            const fee = c.fee
              ? `<span class="fee">${esc(c.fee)}</span>`
              : `<span class="fee free">Free entry</span>`;
            return `<article class="card"><div class="card-inner">
              <div class="card-top"><h3>${esc(c.label)}</h3>${fee}</div>
              ${meta ? `<p class="muted">${meta}</p>` : ""}
              <span class="card-glow"></span>
            </div></article>`;
          })
          .join("")}</div></div></section>`
    : "";

  const formatDetail = [spec.format.ballType, spec.format.notes].filter(Boolean);
  const formatHtml = formatDetail.length
    ? `<section class="section alt reveal"><div class="wrap narrow">
        <div class="section-head"><span class="eyebrow">Format</span><h2>${esc(spec.format.structure)}</h2></div>
        ${formatDetail.map((f) => `<p class="lead">${esc(f)}</p>`).join("")}
      </div></section>`
    : "";

  const prizesHtml =
    spec.prizes.pool || spec.prizes.breakdown || spec.prizes.perks
      ? `<section id="prizes" class="section alt reveal"><div class="wrap narrow center">
          <div class="section-head center"><span class="eyebrow">Play for glory</span><h2>Prizes</h2></div>
          ${spec.prizes.pool ? `<p class="prizepool">${esc(spec.prizes.pool)}</p>` : ""}
          ${spec.prizes.breakdown ? `<p class="lead">${esc(spec.prizes.breakdown)}</p>` : ""}
          ${spec.prizes.perks ? `<p class="muted">${esc(spec.prizes.perks)}</p>` : ""}
        </div></section>`
      : "";

  let sponsorsHtml = "";
  if (spec.sponsors.length) {
    const groups = new Map<string, string[]>();
    for (const s of spec.sponsors) {
      const tier = (s.tier || "partner").toLowerCase();
      const label = s.tier ? s.tier : "Partner";
      const key = TIER_ORDER.includes(tier) ? tier : "partner";
      const arr = groups.get(key) ?? [];
      arr.push(`<span class="sponsor" data-label="${esc(label)}">${esc(s.name)}</span>`);
      groups.set(key, arr);
    }
    const ordered = [...groups.entries()].sort(
      (a, b) => (TIER_ORDER.indexOf(a[0]) + 1 || 99) - (TIER_ORDER.indexOf(b[0]) + 1 || 99)
    );
    sponsorsHtml = `<section id="sponsors" class="section reveal"><div class="wrap">
      <div class="section-head center"><span class="eyebrow">With thanks to</span><h2>Sponsors</h2></div>
      ${ordered
        .map(
          ([tier, names]) =>
            `<div class="tier"><span class="tier-label">${esc(tier)}</span><div class="sponsors">${names.join("")}</div></div>`
        )
        .join("")}
    </div></section>`;
  }

  const howItems = [spec.registration.how, spec.registration.feeNote].filter(Boolean);
  const registerHtml = `<section id="register" class="section register reveal"><div class="wrap narrow center">
      <div class="section-head center"><span class="eyebrow light">Don't miss out</span><h2>How to register</h2></div>
      ${howItems.map((h) => `<p class="lead">${esc(h)}</p>`).join("")}
      ${spec.when.registrationDeadline ? `<p class="deadline">Registration closes ${esc(spec.when.registrationDeadline)}</p>` : ""}
      ${
        regLink
          ? `<a class="btn light big" href="${esc(regLink)}" target="_blank" rel="noopener">Register now</a>`
          : `<p class="muted-light">Registration link coming soon.</p>`
      }
    </div></section>`;

  const contactLinks: string[] = [];
  if (org.email) contactLinks.push(`<a href="mailto:${esc(org.email)}">${esc(org.email)}</a>`);
  if (org.phone) contactLinks.push(`<a href="tel:${esc(org.phone.replace(/\s/g, ""))}">${esc(org.phone)}</a>`);
  const mapUrl = safeUrl(spec.where.mapLink);
  if (mapUrl) contactLinks.push(`<a href="${esc(mapUrl)}" target="_blank" rel="noopener">View map</a>`);
  const socialLinks = org.socials
    .map((s) => {
      const u = safeUrl(s);
      return u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(socialLabel(s))}</a>` : "";
    })
    .filter(Boolean);
  const footerHtml = `<footer><div class="wrap footer-grid">
    <div>
      <p class="foot-name">${esc(brandName)}</p>
      ${org.orgName && org.orgName !== brandName ? `<p class="muted">by ${esc(org.orgName)}</p>` : ""}
      ${spec.where.address || spec.where.city ? `<p class="muted">${esc([spec.where.address, spec.where.city].filter(Boolean).join(", "))}</p>` : ""}
    </div>
    ${contactLinks.length ? `<div><p class="foot-h">Contact</p>${contactLinks.map((l) => `<p>${l}</p>`).join("")}</div>` : ""}
    ${socialLinks.length ? `<div><p class="foot-h">Follow</p><div class="foot-social">${socialLinks.join("")}</div></div>` : ""}
  </div>
  <div class="wrap foot-note"><span>Built with Rizzfitt Tournament Builder</span></div>
  </footer>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(brandName)}</title>
<meta name="description" content="${esc(t.oneLiner || brandName)}" />
<meta property="og:title" content="${esc(brandName)}" />
<meta property="og:description" content="${esc(t.oneLiner || brandName)}" />
<meta name="theme-color" content="${p.accent}" />
<script>document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root{
    --accent:${p.accent};--press:${p.accentPress};--ink:${p.ink};
    --surface:${p.surface};--on:${p.onAccent};--sec:${p.secondary};
    --muted:#6b635b;--faint:#9a938a;--border:#ece9e3;--bg:#f7f6f3;--card:#ffffff;
    --dark:#0e0f14;--maxw:1120px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{font-family:Inter,system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  h1,h2,h3{font-family:"Space Grotesk",Inter,sans-serif;line-height:1.05;letter-spacing:-.02em}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px;width:100%}
  .narrow{max-width:720px}.center{text-align:center;margin-left:auto;margin-right:auto}

  /* Scroll progress */
  #progress{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,var(--accent),var(--press));z-index:100;transition:width .1s linear}

  /* Header */
  header.nav{position:sticky;top:0;z-index:50;backdrop-filter:saturate(1.4) blur(12px);background:color-mix(in srgb, var(--dark) 78%, transparent);border-bottom:1px solid rgba(255,255,255,.08)}
  .nav-in{display:flex;align-items:center;justify-content:space-between;height:64px}
  .brand{display:flex;align-items:center;gap:10px;font-family:"Space Grotesk";font-weight:700;font-size:1.05rem;color:#fff}
  .brand img{height:30px;width:auto;border-radius:6px}
  .nav-links{display:flex;align-items:center;gap:24px}
  .nav-links a{font-size:.9rem;font-weight:500;color:rgba(255,255,255,.7)}
  .nav-links a:hover{color:#fff}
  .nav-links .btn{padding:9px 18px;font-size:.9rem}
  @media(max-width:760px){.nav-links a:not(.btn){display:none}}

  /* Buttons */
  .btn{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:var(--on);font-weight:600;padding:13px 26px;border-radius:12px;transition:transform .16s ease, box-shadow .16s ease;box-shadow:0 8px 24px -10px color-mix(in srgb,var(--accent) 70%, transparent);border:none;cursor:pointer;font-size:1rem}
  .btn:hover{transform:translateY(-2px);box-shadow:0 16px 34px -12px color-mix(in srgb,var(--accent) 80%, transparent)}
  .btn.light{background:#fff;color:var(--press)}
  .btn.ghost{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.25);box-shadow:none}
  .btn.ghost:hover{background:rgba(255,255,255,.18)}
  .btn.big{font-size:1.05rem;padding:16px 34px}

  /* Hero */
  .hero{position:relative;overflow:hidden;background:var(--dark);color:#fff;padding:120px 0 130px;text-align:center;min-height:88vh;display:flex;align-items:center}
  #balls{position:absolute;inset:0;width:100%;height:100%;z-index:0}
  .aurora{position:absolute;inset:-20%;z-index:0;filter:blur(60px);opacity:.55;background:
     radial-gradient(40% 40% at 20% 30%, var(--accent), transparent 60%),
     radial-gradient(35% 35% at 80% 20%, var(--press), transparent 60%),
     radial-gradient(45% 45% at 60% 80%, color-mix(in srgb,var(--accent) 70%, #6d28d9), transparent 60%);
     animation:drift 18s ease-in-out infinite alternate}
  @keyframes drift{0%{transform:translate3d(0,0,0) scale(1)}100%{transform:translate3d(0,-4%,0) scale(1.1)}}
  .hero .wrap{position:relative;z-index:2}
  .kicker{display:inline-block;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.25);padding:7px 16px;border-radius:999px;margin-bottom:26px;backdrop-filter:blur(4px)}
  .hero h1{font-size:clamp(2.8rem,8vw,5.6rem);font-weight:700;max-width:16ch;margin:0 auto;color:#fff;text-shadow:0 2px 30px rgba(0,0,0,.25)}
  .hero h1 .word{display:inline-block}
  .js .hero h1 .word{opacity:0;transform:translateY(24px) rotate(2deg);animation:wordin .7s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:calc(var(--i) * .09s + .1s)}
  @keyframes wordin{to{opacity:1;transform:none}}
  .hero .tag{font-size:clamp(1.05rem,2.4vw,1.45rem);margin-top:20px;color:rgba(255,255,255,.82);max-width:42ch;margin-left:auto;margin-right:auto;opacity:0;animation:fadeup .8s ease .7s forwards}
  .chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:28px;opacity:0;animation:fadeup .8s ease .85s forwards}
  .chip{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);padding:8px 16px;border-radius:999px;font-size:.9rem;font-weight:500;backdrop-filter:blur(4px)}
  .cta-row{margin-top:34px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;opacity:0;animation:fadeup .8s ease 1s forwards}
  @keyframes fadeup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  .scrollcue{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);z-index:2;color:rgba(255,255,255,.6);font-size:12px;letter-spacing:.1em;text-transform:uppercase;animation:bob 2s ease-in-out infinite}
  @keyframes bob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,6px)}}

  /* Stats */
  .stats{background:var(--dark);color:#fff;padding:0 0 64px}
  .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:24px;text-align:center}
  .stat-num{display:block;font-family:"Space Grotesk";font-weight:700;font-size:clamp(2.2rem,5vw,3.4rem);background:linear-gradient(180deg,#fff,rgba(255,255,255,.6));-webkit-background-clip:text;background-clip:text;color:transparent}
  .stat-label{color:rgba(255,255,255,.6);font-size:.9rem;text-transform:uppercase;letter-spacing:.08em}

  /* Glance */
  .glance{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:18px;overflow:hidden;margin-top:-52px;position:relative;z-index:3;box-shadow:0 30px 70px -34px rgba(0,0,0,.4)}
  .glance-item{background:var(--card);padding:22px 20px;display:flex;flex-direction:column;gap:5px}
  .glance-item .k{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);font-weight:600}
  .glance-item .v{font-weight:600;font-size:1.02rem}

  /* Sections */
  .section{padding:84px 0}.section.alt{background:var(--card)}
  .section-head{margin-bottom:34px}.section-head.center{text-align:center}
  .eyebrow{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--accent);margin-bottom:10px}
  .eyebrow.light{color:rgba(255,255,255,.85)}
  .section h2{font-size:clamp(1.9rem,4.5vw,3rem)}
  .lead{font-size:1.1rem}.muted{color:var(--muted)}.muted-light{color:rgba(255,255,255,.8)}

  /* Category cards with 3D tilt */
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px;perspective:1000px}
  .card{transform-style:preserve-3d;transition:transform .18s ease}
  .card-inner{position:relative;background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;overflow:hidden;height:100%;transition:box-shadow .2s ease,border-color .2s ease}
  .card:hover .card-inner{border-color:color-mix(in srgb,var(--accent) 45%,var(--border));box-shadow:0 24px 50px -28px rgba(0,0,0,.35)}
  .card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .card h3{font-size:1.22rem}
  .card .muted{margin-top:10px;font-size:.92rem}
  .card-glow{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 30%,transparent),transparent 70%);top:var(--gy,-100px);left:var(--gx,-100px);opacity:0;transition:opacity .2s;pointer-events:none}
  .card:hover .card-glow{opacity:1}
  .fee{white-space:nowrap;background:color-mix(in srgb,var(--accent) 12%,#fff);color:var(--press);font-weight:700;font-size:.85rem;padding:5px 12px;border-radius:999px}
  .fee.free{background:#e7f6ef;color:#1fa971}

  /* Rally game */
  .rally{background:var(--dark);color:#fff}
  .rally .section-head h2{color:#fff}
  .game-shell{max-width:760px;margin:0 auto;border:1px solid rgba(255,255,255,.14);border-radius:20px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0))}
  .game-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.1);font-family:"Space Grotesk";font-weight:600}
  .game-bar .score{color:var(--accent)}
  #rallyCanvas{display:block;width:100%;height:340px;touch-action:none;cursor:none;background:radial-gradient(120% 120% at 50% 0%, color-mix(in srgb,var(--accent) 18%, var(--dark)), var(--dark))}
  .game-hint{text-align:center;color:rgba(255,255,255,.6);font-size:.9rem;margin-top:16px}
  .game-over{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(14,15,20,.82);backdrop-filter:blur(3px);gap:12px;text-align:center;padding:20px}
  .game-over.show{display:flex}
  .game-wrap{position:relative}

  /* Prizes */
  .prizepool{font-family:"Space Grotesk";font-size:clamp(2.6rem,8vw,4rem);font-weight:700;color:var(--accent);margin:6px 0 16px}

  /* Sponsors */
  .tier{margin-top:26px;text-align:center}
  .tier-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--faint);font-weight:700;margin-bottom:14px}
  .sponsors{display:flex;flex-wrap:wrap;gap:14px;justify-content:center}
  .sponsor{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px 26px;font-weight:600;font-size:1.05rem;transition:transform .16s}
  .sponsor:hover{transform:translateY(-3px)}

  /* Register band */
  .register{position:relative;overflow:hidden;background:radial-gradient(130% 150% at 50% 0%, var(--accent), var(--press));color:var(--on)}
  .register .lead{color:rgba(255,255,255,.92)}
  .deadline{margin-top:16px;font-weight:600;background:rgba(255,255,255,.16);display:inline-block;padding:9px 18px;border-radius:999px}
  .register .btn.light{margin-top:28px}

  /* Footer */
  footer{background:var(--dark);color:#fff;padding:64px 0 34px}
  .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:34px}
  @media(max-width:640px){.footer-grid{grid-template-columns:1fr;gap:22px}}
  .foot-name{font-family:"Space Grotesk";font-weight:700;font-size:1.25rem}
  footer .muted{color:rgba(255,255,255,.55)}
  .foot-h{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.45);font-weight:700;margin-bottom:12px}
  footer a{color:rgba(255,255,255,.82)}footer a:hover{color:#fff}
  footer p+p{margin-top:7px}
  .foot-social{display:flex;flex-wrap:wrap;gap:16px}
  .foot-note{margin-top:40px;padding-top:22px;border-top:1px solid rgba(255,255,255,.12);font-size:.85rem;color:rgba(255,255,255,.5)}

  /* Motion (JS-gated so no-JS shows everything) */
  .js .reveal{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease}
  .js .reveal.in{opacity:1;transform:none}
  @media(prefers-reduced-motion:reduce){
    .js .reveal{opacity:1;transform:none;transition:none}
    .hero h1 .word,.hero .tag,.chips,.cta-row{animation:none;opacity:1;transform:none}
    .aurora,.scrollcue{animation:none}
    .btn:hover,.card:hover,.sponsor:hover{transform:none}
    html{scroll-behavior:auto}
  }
</style>
</head>
<body>
  <div id="progress"></div>
  <header class="nav"><div class="wrap nav-in">
    <a class="brand" href="#top">${logo ? `<img src="${esc(logo)}" alt="" />` : ""}<span>${esc(brandName)}</span></a>
    <nav class="nav-links">
      ${nav.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join("")}
      <a class="btn" href="${esc(regHref)}"${regLink ? ' target="_blank" rel="noopener"' : ""}>Register</a>
    </nav>
  </div></header>

  <header id="top" class="hero">
    <div class="aurora"></div>
    <canvas id="balls" aria-hidden="true"></canvas>
    <div class="wrap">
      ${t.edition || t.year ? `<span class="kicker">${esc([t.edition, t.year].filter(Boolean).join(" · "))}</span>` : ""}
      <h1>${headline}</h1>
      ${t.tagline ? `<p class="tag">${esc(t.tagline)}</p>` : ""}
      ${chips.length ? `<div class="chips">${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : ""}
      <div class="cta-row">
        <a class="btn light big" href="${esc(regHref)}"${regLink ? ' target="_blank" rel="noopener"' : ""}>Register now</a>
        <a class="btn ghost big" href="#rally">Play a rally</a>
      </div>
    </div>
    <span class="scrollcue">Scroll</span>
  </header>

  ${statsHtml}
  ${detailsHtml}
  ${categoriesHtml}

  <section id="rally" class="section rally reveal"><div class="wrap">
    <div class="section-head center"><span class="eyebrow light">Warm up</span><h2>Can you keep the rally going?</h2></div>
    <div class="game-shell"><div class="game-bar">
        <span>Rally: <span class="score" id="rallyScore">0</span></span>
        <span>Best: <span id="rallyBest">0</span></span>
      </div>
      <div class="game-wrap">
        <canvas id="rallyCanvas"></canvas>
        <div class="game-over" id="rallyOver">
          <h3 style="font-size:1.6rem">Rally over</h3>
          <p class="muted-light">You hit <span id="rallyFinal">0</span> shots.</p>
          <button class="btn light" id="rallyRestart">Play again</button>
        </div>
      </div>
    </div>
    <p class="game-hint">Move to control the paddle. Keep the ball alive. Then register for the real thing.</p>
  </div></section>

  ${formatHtml}
  ${prizesHtml}
  ${sponsorsHtml}
  ${registerHtml}
  ${footerHtml}

  <script>
  (function(){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Scroll progress */
    var bar = document.getElementById('progress');
    function onScroll(){
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
    document.addEventListener('scroll', onScroll, {passive:true}); onScroll();

    /* Reveal on scroll */
    var els = document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window)){ els.forEach(function(e){e.classList.add('in')}); }
    else {
      var io = new IntersectionObserver(function(en){
        en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); } });
      }, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
      els.forEach(function(e){ io.observe(e); });
      setTimeout(function(){ els.forEach(function(e){ e.classList.add('in'); }); }, 2600);
    }

    /* Count-up stats */
    var counted = false;
    function runCount(){
      if(counted) return; counted = true;
      document.querySelectorAll('.stat-num').forEach(function(el){
        var target = parseInt(el.getAttribute('data-count'),10) || 0;
        var prefix = el.getAttribute('data-prefix') || '';
        if(reduce){ el.textContent = prefix + target.toLocaleString(); return; }
        var start = null, dur = 1400;
        function step(ts){
          if(!start) start = ts;
          var pr = Math.min((ts - start)/dur, 1);
          var eased = 1 - Math.pow(1 - pr, 3);
          el.textContent = prefix + Math.floor(eased * target).toLocaleString();
          if(pr < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
    var statSec = document.querySelector('.stats');
    if(statSec && 'IntersectionObserver' in window){
      var so = new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting){ runCount(); so.disconnect(); } }); }, {threshold:.4});
      so.observe(statSec);
    } else { runCount(); }

    /* 3D tilt on category cards */
    if(!reduce){
      document.querySelectorAll('[data-tilt] .card').forEach(function(card){
        card.addEventListener('pointermove', function(e){
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
          card.style.transform = 'rotateY(' + ((px-.5)*10) + 'deg) rotateX(' + ((.5-py)*10) + 'deg) translateZ(6px)';
          var glow = card.querySelector('.card-glow');
          if(glow){ glow.style.setProperty('--gx', (px*r.width - 90) + 'px'); glow.style.setProperty('--gy', (py*r.height - 90) + 'px'); }
        });
        card.addEventListener('pointerleave', function(){ card.style.transform = ''; });
      });
    }

    /* Hero floating balls (pseudo-3D parallax) */
    var canvas = document.getElementById('balls');
    if(canvas && !reduce){
      var ctx = canvas.getContext('2d');
      var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f16c1d';
      var W, H, dots = [], DPR = Math.min(window.devicePixelRatio || 1, 2);
      function resize(){
        var hero = canvas.parentElement;
        W = hero.clientWidth; H = hero.clientHeight;
        canvas.width = W*DPR; canvas.height = H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
      }
      function make(){
        dots = [];
        var n = Math.max(14, Math.min(30, Math.floor(W/48)));
        for(var i=0;i<n;i++){
          var depth = Math.random();
          dots.push({ x:Math.random()*W, y:Math.random()*H, r:6+depth*22, depth:depth,
            vx:(Math.random()-.5)*(.2+depth*.5), vy:(Math.random()-.5)*(.2+depth*.5) });
        }
      }
      function draw(){
        ctx.clearRect(0,0,W,H);
        for(var i=0;i<dots.length;i++){
          var d = dots[i]; d.x += d.vx; d.y += d.vy;
          if(d.x< -30) d.x=W+30; if(d.x>W+30) d.x=-30; if(d.y<-30) d.y=H+30; if(d.y>H+30) d.y=-30;
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
          ctx.fillStyle = accent; ctx.globalAlpha = .06 + d.depth*.14; ctx.fill();
        }
        ctx.globalAlpha = 1; requestAnimationFrame(draw);
      }
      window.addEventListener('resize', function(){ resize(); make(); });
      resize(); make(); draw();
    }

    /* Interactive pickleball rally mini-game */
    var rc = document.getElementById('rallyCanvas');
    if(rc){
      var g = rc.getContext('2d');
      var accent2 = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f16c1d';
      var gw, gh, GDPR = Math.min(window.devicePixelRatio || 1, 2);
      var ball, paddle, score, best = 0, playing = false, raf;
      var scoreEl = document.getElementById('rallyScore');
      var bestEl = document.getElementById('rallyBest');
      var overEl = document.getElementById('rallyOver');
      var finalEl = document.getElementById('rallyFinal');
      try { best = parseInt(localStorage.getItem('rallyBest')||'0',10)||0; } catch(e){}
      bestEl.textContent = best;

      function gsize(){
        gw = rc.clientWidth; gh = rc.clientHeight;
        rc.width = gw*GDPR; rc.height = gh*GDPR; g.setTransform(GDPR,0,0,GDPR,0,0);
      }
      function reset(){
        gsize();
        ball = { x: gw/2, y: gh*0.3, vx: (Math.random()<.5?-1:1)*3.2, vy: 2.4, r: 11 };
        paddle = { x: gw/2, y: gh-22, w: 96, h: 12 };
        score = 0; scoreEl.textContent = '0';
      }
      function start(){ overEl.classList.remove('show'); reset(); playing = true; cancelAnimationFrame(raf); loop(); }
      function movePaddle(clientX){
        var r = rc.getBoundingClientRect();
        paddle.x = Math.max(paddle.w/2, Math.min(gw - paddle.w/2, clientX - r.left));
      }
      rc.addEventListener('pointermove', function(e){ movePaddle(e.clientX); });
      rc.addEventListener('pointerdown', function(e){ movePaddle(e.clientX); if(!playing) start(); });
      var restart = document.getElementById('rallyRestart');
      if(restart) restart.addEventListener('click', start);

      function loop(){
        g.clearRect(0,0,gw,gh);
        // court centre line
        g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; g.setLineDash([6,10]);
        g.beginPath(); g.moveTo(0,gh/2); g.lineTo(gw,gh/2); g.stroke(); g.setLineDash([]);

        if(playing){
          ball.x += ball.vx; ball.y += ball.vy; ball.vy += 0.06;
          if(ball.x < ball.r){ ball.x = ball.r; ball.vx *= -1; }
          if(ball.x > gw-ball.r){ ball.x = gw-ball.r; ball.vx *= -1; }
          if(ball.y < ball.r){ ball.y = ball.r; ball.vy *= -1; }
          // paddle hit
          if(ball.y + ball.r >= paddle.y && ball.y < paddle.y + paddle.h &&
             ball.x > paddle.x - paddle.w/2 && ball.x < paddle.x + paddle.w/2 && ball.vy > 0){
            ball.vy = -Math.abs(ball.vy) - 0.25;
            ball.vx += (ball.x - paddle.x)/paddle.w * 3;
            ball.y = paddle.y - ball.r;
            score++; scoreEl.textContent = score;
          }
          if(ball.y - ball.r > gh){
            playing = false;
            if(score > best){ best = score; bestEl.textContent = best; try{ localStorage.setItem('rallyBest', String(best)); }catch(e){} }
            finalEl.textContent = score; overEl.classList.add('show');
          }
        }
        // draw paddle
        g.fillStyle = '#fff'; roundRect(g, paddle.x-paddle.w/2, paddle.y, paddle.w, paddle.h, 6); g.fill();
        // draw ball
        g.beginPath(); g.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); g.fillStyle = accent2; g.fill();
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5;
        for(var a=0;a<3;a++){ g.beginPath(); g.arc(ball.x, ball.y, ball.r*0.55, a*2.09, a*2.09+1.1); g.stroke(); }

        if(!playing && score === 0 && !overEl.classList.contains('show')){
          g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '600 16px Inter, sans-serif'; g.textAlign = 'center';
          g.fillText('Tap or move to start', gw/2, gh/2 - 10);
        }
        raf = requestAnimationFrame(loop);
      }
      function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
      window.addEventListener('resize', function(){ var wasPlaying = playing; gsize(); if(!wasPlaying){ /* keep idle */ } });
      reset(); loop(); // idle render; starts on interaction
    }
  })();
  </script>
</body>
</html>`;
}
