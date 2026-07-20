# Tournament OS + Tournament Builder

Two complementary Rizzfitt products in one Next.js (App Router, TypeScript)
+ Supabase + Tailwind v4 + shadcn/ui codebase:

- **Tournament OS** (`/dashboard`, `/login`, `/onboarding`) — multi-tenant
  SaaS (PWA) for running tournaments end to end: registrations, payments,
  comms, and the match-day handoff to Rizzfitt's scoring core.
- **Tournament Builder** (`/builder`) — describe a tournament once and get a
  live website, an email campaign with contacts, and a marketing kit,
  automatically. Phase 1 (intake → canonical Brief → Generation Spec) is in;
  the three generation agents follow.

Shared design system, Supabase, and Zod boundary. The app **boots and the
public pages render even before Supabase is configured**, so the Vercel
deploy is viewable immediately (DB-backed features light up once the env
vars are set — see Deploy below).

## Deploy to Vercel

The production build needs **no env vars** (Supabase is read at request
time), so the first deploy succeeds out of the box. To light up auth + the
database, set these in Vercel → Project → Settings → Environment Variables:

| Variable | Required for | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | auth, DB, builder | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | auth, DB, builder | same |
| `SUPABASE_SERVICE_ROLE_KEY` | core REST API, webhooks | same (server-only) |
| `CORE_API_KEY` | `GET /api/core/entry-list` | your own secret |
| `CORE_SHARED_SECRET` | `POST /api/core/results` | your own secret |

Then run the migrations in `supabase/migrations/` against the project
(`supabase db push`, or paste into the Supabase SQL editor in order), and
redeploy. `supabase/seed.sql` loads a demo org + tournament for local dev.

## Setup

```bash
npm install

# Local Supabase (install the CLI first: https://supabase.com/docs/guides/cli)
supabase start          # spins up Postgres/auth/studio
supabase db reset       # applies migrations + seed (demo org & tournament)

npm run dev             # http://localhost:3000
```

`.env.local` ships with the Supabase CLI's public local-dev keys. For a
hosted project, copy `.env.example` and fill in your project's values,
then apply migrations with `supabase db push`.

## What's here

- **Design system** — RIZZFITT tokens as CSS variables + Tailwind theme
  in [globals.css](src/app/globals.css). Fonts: Clash Display (display),
  General Sans (body), Space Mono (every number, money, date, ID).
- **Component library** — [src/components/app/](src/components/app/):
  AppShell, StatCard, StatusPill, DataTable (CSV export), WizardStepper,
  FormField, MoneyText, Drawer, ConfirmDialog (typed confirm + logged
  reason), EmptyState, Skeletons. Demoed on **/styleguide**.
- **Database** — [supabase/migrations/](supabase/migrations/): all
  DATA_MODEL.md tables, exact status enums, DB-enforced invariants
  (race-safe capacity check, one open Razorpay order per entry, entry
  confirmation rules, status-machine triggers), `core_entry_list` view +
  amendment NOTIFY for the scoring core, realtime on entries/payments.
- **RLS** — memberships gate org data; players read their own
  entries/payments; anonymous users read only published tournament page
  data. Helpers live in the `private` schema.
- **Auth** — passwordless **email sign-in link** on **/login**
  (Supabase built-in email; free-tier compatible, no SMS/domain needed),
  exchanged at `/auth/callback`; session refresh in
  [proxy.ts](src/proxy.ts); per-org role helpers (owner/manager/desk) in
  [session.ts](src/lib/auth/session.ts). The app degrades gracefully when
  Supabase env vars are absent (see [env.ts](src/lib/supabase/env.ts)).
- **Domain types** — Zod schemas for every table at the boundary
  ([schemas.ts](src/lib/domain/schemas.ts)) and a typed Supabase client
  ([database.types.ts](src/lib/supabase/database.types.ts)). No `any` in
  domain code.
- **PWA** — installable manifest + minimal service worker with an
  offline fallback page.
- **Onboarding (Flow O) + dashboard shell** — `/onboarding` wizard:
  O1 captures the user's name, O2 creates the organisation (name → deduped
  slug, city, logo uploaded to the `org-logos` storage bucket) atomically
  with an owner membership via the `create_organisation` RPC. `/dashboard`
  lists the active org's tournaments (RLS-scoped), with an org switcher +
  profile in [AppShell](src/components/app/app-shell.tsx); the empty state
  shows a welcome, a 4-item getting-started checklist, and a sample-event
  preview link. Login falls back to email magic link after 3 OTP failures.
- **Core boundary** (DATA_MODEL §5) — `core_entry_list` view (locked
  entries, teams resolved, `is_multi_entry`), `matches` + `results`
  tables written by the core, an audit-log amendment `NOTIFY`, and a
  typed read API in [src/lib/core/](src/lib/core/). REST fallback for the
  separate-service case: `GET /api/core/entry-list/[tournamentId]`
  (Bearer auth) and `POST /api/core/results` (HMAC signature).
  **TODO(rizzfitt):** confirm shared-DB vs REST with the core dev partner.
- **Tournament Builder (Phase 1)** — [src/lib/builder/](src/lib/builder/):
  the canonical Tournament Brief schema, a deterministic synthesis pass
  (Brief → Generation Spec, contrast-enforced palette), and an anonymous
  token-gated persistence layer (`builder_briefs` + SECURITY DEFINER RPCs).
  UI: a 7-step intake form at **/builder/intake** and a review surface at
  `/builder/[id]/review`. Generators (landing page + Vercel deploy, email +
  contacts + conflict detection, marketing kit) are the next phases and are
  built **template-first**, upgrading automatically if `ANTHROPIC_API_KEY`
  is added.

## Demo logins (local seed)

| Who | Email | Role |
| --- | --- | --- |
| Asha Owner | `owner@rizzfitt.demo` | owner of RizzFitt Sports Club |
| Dev Desk | `desk@rizzfitt.demo` | desk |
| Rohan/Meera/Arjun/Sana | `*@player.demo` | players (no membership) |

Password locally: `demo-password`. Phone OTP test numbers
`+919800000001/2` accept code `123456` (see `supabase/config.toml`).

## Checks

```bash
npx tsc --noEmit   # type-check
npm run build      # production build
npm run lint
supabase test db   # pgTAP tests (supabase/tests/) — needs the Supabase CLI
```

`supabase/tests/core_entry_list_test.sql` asserts a published tournament's
locked (confirmed/checked_in) entries surface in `core_entry_list` with
teams resolved, and that pending/withdrawn entries do not.
