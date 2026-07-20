# Rizzfitt Tournament Builder

A Next.js (App Router, TypeScript) + Supabase + Tailwind v4 + shadcn/ui app.
The live product is the **Tournament Builder**: describe a tournament once
and get a live website, an email campaign with contacts, and a marketing
kit, automatically — **no account, no sign-in**. Phase 1 (intake → canonical
Brief → Generation Spec) is in; the three generation agents follow.

Briefs are anonymous and reached by an `id` + secret `edit_token`, gated
through `SECURITY DEFINER` RPCs (no login needed).

The repo also contains the **Tournament OS** foundation — the full
registrations/payments/comms data model, RLS, and the scoring-core boundary
(`supabase/migrations/`, `src/lib/domain`, `src/lib/core`, `src/lib/supabase`)
— kept as the backend foundation for the organiser side. The auth UI
(login/onboarding/dashboard) was removed to keep the shipped app focused and
fully working; it can be reintroduced later on top of the same schema.

The app **boots and renders even before Supabase is configured** (the builder
save lights up once env vars are set — see Deploy below).

## Deploy to Vercel

The production build needs **no env vars** (Supabase is read at request
time), so the first deploy succeeds out of the box. To light up auth + the
database, set these in Vercel → Project → Settings → Environment Variables:

| Variable | Required for | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | saving builder briefs | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | saving builder briefs | same |
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
- **No auth** — the shipped app has no login. The Builder is anonymous
  (id + `edit_token`). The app degrades gracefully when Supabase env vars
  are absent (see [env.ts](src/lib/supabase/env.ts)).
- **Domain types** — Zod schemas for every table at the boundary
  ([schemas.ts](src/lib/domain/schemas.ts)) and a typed Supabase client
  ([database.types.ts](src/lib/supabase/database.types.ts)). No `any` in
  domain code.
- **PWA** — installable manifest + minimal service worker with an
  offline fallback page.
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
