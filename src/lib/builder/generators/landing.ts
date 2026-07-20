/**
 * Landing Page generator (MVP build prompt §8.1) — turns the Generation
 * Spec into a complete, self-contained, mobile-first HTML tournament site,
 * themed from the organiser's palette. Deterministic (no LLM needed);
 * empty sections are omitted (never fabricate). Copy rules §11: ranges use
 * "to", no em dashes.
 *
 * Design goals: premium and intentional, not templated-looking. Sticky
 * nav, a strong gradient hero with meta chips, glanceable detail cards,
 * category cards with fee badges, tiered sponsors, a real contact footer,
 * and restrained scroll-reveal motion (respects reduced-motion).
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
  if (/^[\w.-]+\.\w{2,}(\/|$)/.test(v)) return "https://" + v; // bare domain
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

export function renderLandingHtml(spec: GenerationSpec): string {
  const p = spec.branding.palette;
  const t = spec.tournament;
  const org = spec.organizer;
  const regLink = safeUrl(spec.registration.link);
  const logo = safeUrl(spec.branding.logoUrl);
  const brandName = t.name || org.orgName || "Tournament";

  // ── Nav anchors (only for sections that exist) ─────────────────────
  const nav: Array<[string, string]> = [];
  if (spec.categories.length) nav.push(["categories", "Categories"]);
  if (spec.prizes.pool || spec.prizes.breakdown || spec.prizes.perks) nav.push(["prizes", "Prizes"]);
  if (spec.sponsors.length) nav.push(["sponsors", "Sponsors"]);
  nav.push(["register", "Register"]);

  // ── Hero meta chips ────────────────────────────────────────────────
  const chips = [
    spec.when.dateRange,
    spec.where.city,
    spec.format.structure,
  ].filter(Boolean);

  // ── At-a-glance detail cards ───────────────────────────────────────
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
        <div class="cards">${spec.categories
          .map((c) => {
            const meta = [c.bracket, c.slots ? `${esc(c.slots)} slots` : ""]
              .filter(Boolean)
              .map(esc)
              .join(" &middot; ");
            const fee = c.fee
              ? `<span class="fee">${esc(c.fee)}</span>`
              : `<span class="fee free">Free entry</span>`;
            return `<article class="card">
              <div class="card-top"><h3>${esc(c.label)}</h3>${fee}</div>
              ${meta ? `<p class="muted">${meta}</p>` : ""}
            </article>`;
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
      ? `<section id="prizes" class="section reveal"><div class="wrap narrow center">
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
    sponsorsHtml = `<section id="sponsors" class="section alt reveal"><div class="wrap">
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

  // ── Footer: organiser + contact + socials + map ────────────────────
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
    --muted:#6b635b;--faint:#9a938a;--border:#ece9e3;--bg:#faf9f7;--card:#ffffff;
    --maxw:1080px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{font-family:Inter,system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
  h1,h2,h3{font-family:"Space Grotesk",Inter,sans-serif;line-height:1.08;letter-spacing:-.01em}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px;width:100%}
  .narrow{max-width:720px}.center{text-align:center;margin-left:auto;margin-right:auto}

  /* Header */
  header.nav{position:sticky;top:0;z-index:50;backdrop-filter:saturate(1.4) blur(10px);background:color-mix(in srgb, var(--bg) 82%, transparent);border-bottom:1px solid var(--border)}
  .nav-in{display:flex;align-items:center;justify-content:space-between;height:64px}
  .brand{display:flex;align-items:center;gap:10px;font-family:"Space Grotesk";font-weight:700;font-size:1.05rem}
  .brand img{height:30px;width:auto;border-radius:6px}
  .nav-links{display:flex;align-items:center;gap:26px}
  .nav-links a{font-size:.9rem;font-weight:500;color:var(--muted)}
  .nav-links a:hover{color:var(--ink)}
  .nav-links .btn{padding:9px 18px;font-size:.9rem}
  @media(max-width:720px){.nav-links a:not(.btn){display:none}}

  /* Buttons */
  .btn{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:var(--on);font-weight:600;padding:13px 26px;border-radius:12px;transition:transform .16s ease, box-shadow .16s ease;box-shadow:0 6px 20px -8px color-mix(in srgb,var(--accent) 60%, transparent)}
  .btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px -10px color-mix(in srgb,var(--accent) 70%, transparent)}
  .btn.light{background:var(--on);color:var(--press)}
  .btn.big{font-size:1.05rem;padding:16px 36px}

  /* Hero */
  .hero{position:relative;overflow:hidden;background:
      radial-gradient(120% 120% at 15% 0%, color-mix(in srgb,var(--accent) 90%, #fff) 0%, var(--accent) 42%, var(--press) 100%);
      color:var(--on);padding:96px 0 104px;text-align:center}
  .hero::after{content:"";position:absolute;inset:0;background:
      radial-gradient(40% 50% at 85% 20%, rgba(255,255,255,.18), transparent 70%),
      radial-gradient(30% 40% at 10% 90%, rgba(0,0,0,.10), transparent 70%);pointer-events:none}
  .hero .wrap{position:relative;z-index:1}
  .hero .kicker{display:inline-block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;opacity:.92;border:1px solid rgba(255,255,255,.35);padding:6px 14px;border-radius:999px;margin-bottom:22px}
  .hero h1{font-size:clamp(2.6rem,7vw,5rem);font-weight:700;max-width:15ch;margin:0 auto}
  .hero .tag{font-size:clamp(1.05rem,2.4vw,1.4rem);margin-top:18px;opacity:.95;max-width:40ch;margin-left:auto;margin-right:auto}
  .chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:26px}
  .chip{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);padding:7px 15px;border-radius:999px;font-size:.9rem;font-weight:500}
  .hero .cta-row{margin-top:32px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

  /* Glance */
  .glance{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-top:-40px;position:relative;z-index:2;box-shadow:0 24px 60px -30px rgba(0,0,0,.25)}
  .glance-item{background:var(--card);padding:22px 20px;display:flex;flex-direction:column;gap:5px}
  .glance-item .k{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);font-weight:600}
  .glance-item .v{font-weight:600;font-size:1.02rem}

  /* Sections */
  .section{padding:72px 0}.section.alt{background:var(--card)}
  .section-head{margin-bottom:32px}.section-head.center{text-align:center}
  .eyebrow{display:block;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;color:var(--accent);margin-bottom:8px}
  .eyebrow.light{color:rgba(255,255,255,.85)}
  .section h2{font-size:clamp(1.7rem,4vw,2.6rem)}
  .lead{font-size:1.08rem;color:var(--ink)}
  .muted{color:var(--muted)}.muted-light{color:rgba(255,255,255,.8)}

  /* Cards */
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
  .card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
  .card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--accent) 40%,var(--border));box-shadow:0 16px 40px -24px rgba(0,0,0,.3)}
  .card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .card h3{font-size:1.18rem}
  .card .muted{margin-top:10px;font-size:.92rem}
  .fee{white-space:nowrap;background:color-mix(in srgb,var(--accent) 12%,#fff);color:var(--press);font-weight:700;font-size:.85rem;padding:5px 11px;border-radius:999px}
  .fee.free{background:#e7f6ef;color:#1fa971}

  /* Prizes */
  .prizepool{font-family:"Space Grotesk";font-size:clamp(2.4rem,7vw,3.6rem);font-weight:700;color:var(--accent);margin:6px 0 14px}

  /* Sponsors */
  .tier{margin-top:24px;text-align:center}
  .tier-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--faint);font-weight:600;margin-bottom:12px}
  .sponsors{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
  .sponsor{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 22px;font-weight:600;font-size:1.02rem}

  /* Register band */
  .register{background:radial-gradient(120% 140% at 50% 0%, var(--accent), var(--press));color:var(--on)}
  .register .lead{color:rgba(255,255,255,.92)}
  .deadline{margin-top:14px;font-weight:600;background:rgba(255,255,255,.15);display:inline-block;padding:8px 16px;border-radius:999px}
  .register .btn.light{margin-top:26px}

  /* Footer */
  footer{background:var(--sec);color:#fff;padding:56px 0 32px}
  .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:32px}
  @media(max-width:640px){.footer-grid{grid-template-columns:1fr;gap:20px}}
  .foot-name{font-family:"Space Grotesk";font-weight:700;font-size:1.2rem}
  footer .muted{color:rgba(255,255,255,.6)}
  .foot-h{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.5);font-weight:600;margin-bottom:10px}
  footer a{color:rgba(255,255,255,.85)}footer a:hover{color:#fff}
  footer p+p{margin-top:6px}
  .foot-social{display:flex;flex-wrap:wrap;gap:14px}
  .foot-note{margin-top:36px;padding-top:20px;border-top:1px solid rgba(255,255,255,.12);font-size:.85rem;color:rgba(255,255,255,.5)}

  /* Motion — only hide when JS is on (no-JS sees everything). */
  .js .reveal{opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease}
  .js .reveal.in{opacity:1;transform:none}
  @media(prefers-reduced-motion:reduce){.js .reveal{opacity:1;transform:none;transition:none}.btn:hover,.card:hover{transform:none}html{scroll-behavior:auto}}
</style>
</head>
<body>
  <header class="nav"><div class="wrap nav-in">
    <a class="brand" href="#top">${logo ? `<img src="${esc(logo)}" alt="" />` : ""}<span>${esc(brandName)}</span></a>
    <nav class="nav-links">
      ${nav.filter(([id]) => id !== "register").map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join("")}
      ${regLink ? `<a class="btn" href="${esc(regLink)}" target="_blank" rel="noopener">Register</a>` : `<a class="btn" href="#register">Register</a>`}
    </nav>
  </div></header>

  <header id="top" class="hero"><div class="wrap">
    ${t.edition || t.year ? `<span class="kicker">${esc([t.edition, t.year].filter(Boolean).join(" · "))}</span>` : ""}
    <h1>${esc(t.name || "Your Tournament")}</h1>
    ${t.tagline ? `<p class="tag">${esc(t.tagline)}</p>` : ""}
    ${chips.length ? `<div class="chips">${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : ""}
    <div class="cta-row">
      ${regLink ? `<a class="btn light big" href="${esc(regLink)}" target="_blank" rel="noopener">Register now</a>` : `<a class="btn light big" href="#register">How to register</a>`}
      ${spec.categories.length ? `<a class="chip" href="#categories" style="padding:16px 24px">See categories</a>` : ""}
    </div>
  </div></header>

  ${detailsHtml}
  ${categoriesHtml}
  ${formatHtml}
  ${prizesHtml}
  ${sponsorsHtml}
  ${registerHtml}
  ${footerHtml}

  <script>
    (function(){
      var els=document.querySelectorAll('.reveal');
      if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return;}
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});
      },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
      els.forEach(function(e){io.observe(e)});
      // Safety net: never leave a section hidden.
      setTimeout(function(){els.forEach(function(e){e.classList.add('in')})},2500);
    })();
  </script>
</body>
</html>`;
}
