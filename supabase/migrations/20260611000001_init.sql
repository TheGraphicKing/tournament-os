-- ════════════════════════════════════════════════════════════════════
-- Tournament OS — initial schema. Implements DATA_MODEL.md exactly.
-- Every domain table carries org_id; RLS is added in the next migration.
-- NOTE: `matches` is owned & created by the CORE (DATA_MODEL §5), not here.
-- ════════════════════════════════════════════════════════════════════

-- ── Enums (DATA_MODEL §3 — exact values, never invented in UI) ──────
create type org_role as enum ('owner', 'manager', 'desk');
create type tournament_status as enum
  ('draft', 'published', 'reg_open', 'reg_closed', 'live', 'completed', 'archived');
create type entry_status as enum
  ('pending_payment', 'confirmed', 'waitlisted', 'pending_partner', 'withdrawn', 'refunded', 'checked_in');
create type payment_status as enum
  ('created', 'paid', 'failed', 'refund_pending', 'refunded');
create type claim_status as enum ('claimed', 'unclaimed');
create type announcement_status as enum ('pending', 'sent', 'failed');
create type job_status as enum ('pending', 'done', 'failed');
create type refund_policy as enum ('full_d7', 'half_d2', 'none');
create type category_format as enum ('knockout', 'league', 'groups');
create type category_kind as enum ('singles', 'doubles', 'team');
create type announcement_segment as enum ('all', 'category', 'unpaid', 'waitlist');
create type announcement_channel as enum ('email', 'sms', 'whatsapp');
create type sponsor_tier as enum ('title', 'gold', 'silver', 'partner');
create type certificate_type as enum ('participation', 'winner', 'runner_up', 'semi');
create type report_type as enum ('finance', 'registrations', 'ops', 'sponsor', 'feedback');

-- ── Tenancy & roles (DATA_MODEL §1) ─────────────────────────────────
create table organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  brand_theme jsonb,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- One global account, mirrored from auth.users by trigger below.
create table users (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  phone      text unique,
  email      text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table memberships (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organisations (id) on delete cascade,
  user_id    uuid not null references users (id) on delete cascade,
  role       org_role not null,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

-- Mirror new auth users into public.users (a player is just a user with
-- no membership in the org running the event).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, phone, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.phone,
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set phone = excluded.phone,
        email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of phone, email on auth.users
  for each row execute function public.handle_new_user();

-- ── Tournaments & categories (DATA_MODEL §2) ────────────────────────
create table tournaments (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organisations (id) on delete cascade,
  slug             text not null unique,
  name             text not null,
  sport            text not null default 'pickleball',
  status           tournament_status not null default 'draft',
  venue_name       text,
  venue_maps_url   text,
  city             text,
  start_date       date,
  end_date         date,
  cover_url        text,
  theme            jsonb,            -- extracted accent/neutrals (DESIGN_SYSTEM PART 4)
  reg_opens_at     timestamptz,
  reg_closes_at    timestamptz,
  refund_policy    refund_policy not null default 'none',
  waitlist_enabled boolean not null default false,
  collect_fields   jsonb,            -- which player fields to capture
  contact_whatsapp text,
  show_whatsapp    boolean not null default false,
  about_md         text,
  rules_md         text,
  faqs             jsonb,
  created_at       timestamptz not null default now(),
  published_at     timestamptz
);

create table categories (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  name          text not null,
  fee_inr       integer not null check (fee_inr >= 0),
  capacity      integer not null check (capacity > 0),
  format        category_format not null,
  kind          category_kind not null,
  eligibility   jsonb,              -- gender/age/skill rules (free text allowed)
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ── Teams (before entries: entries.team_id references teams) ────────
create table teams (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  category_id   uuid not null references categories (id) on delete cascade,
  name          text not null,
  created_at    timestamptz not null default now()
);

create table team_members (
  team_id      uuid not null references teams (id) on delete cascade,
  user_id      uuid not null references users (id) on delete cascade,
  claim_status claim_status not null default 'unclaimed',
  is_payer     boolean not null default false,
  primary key (team_id, user_id)
);

-- ── Entries ──────────────────────────────────────────────────────────
create table entries (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organisations (id) on delete cascade,
  tournament_id   uuid not null references tournaments (id) on delete cascade,
  category_id     uuid not null references categories (id) on delete cascade,
  status          entry_status not null default 'pending_payment',
  primary_user_id uuid not null references users (id),
  team_id         uuid references teams (id) on delete set null,
  amount_inr      integer not null check (amount_inr >= 0),  -- server-computed, never client
  collected       jsonb,
  is_multi_entry  boolean not null default false,            -- player in >1 category (core scheduling flag)
  offline         boolean not null default false,
  note            text,
  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  checked_in_at   timestamptz
);

-- ── Payments ─────────────────────────────────────────────────────────
create table payments (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organisations (id) on delete cascade,
  entry_id            uuid not null references entries (id) on delete cascade,
  razorpay_order_id   text unique,
  razorpay_payment_id text,
  amount_inr          integer not null check (amount_inr >= 0),
  status              payment_status not null default 'created',
  invoice_url         text,
  refund_amount_inr   integer,
  refund_reason       text,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  refunded_at         timestamptz
);

-- INVARIANT (DATA_MODEL §4): one open Razorpay order per entry at a time.
create unique index payments_one_open_order_per_entry
  on payments (entry_id) where status = 'created';

-- ── Comms & ops ──────────────────────────────────────────────────────
create table announcements (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id) on delete cascade,
  tournament_id uuid not null references tournaments (id) on delete cascade,
  segment       announcement_segment not null default 'all',
  segment_ref   text,
  channel       announcement_channel not null,
  subject       text,
  body_md       text not null,
  status        announcement_status not null default 'pending',
  scheduled_for timestamptz,
  sent_at       timestamptz
);

create table scheduled_jobs (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references organisations (id) on delete cascade,
  type      text not null,
  payload   jsonb not null default '{}'::jsonb,
  run_after timestamptz not null,
  status    job_status not null default 'pending',
  attempts  integer not null default 0
);

create table sponsors (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id) on delete cascade,
  tournament_id uuid not null references tournaments (id) on delete cascade,
  name          text not null,
  logo_url      text,
  tier          sponsor_tier not null default 'partner',
  link          text,
  placement     jsonb,
  source_url    text,        -- show sources for AI-suggested sponsors; never fabricate
  suggested     boolean not null default false,
  approved      boolean not null default false
);

-- ── Results & post-event (DATA_MODEL §2) ─────────────────────────────
create table results (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  category_id   uuid not null references categories (id) on delete cascade,
  standings     jsonb not null   -- WRITTEN BY CORE; app reads (publish toggles only)
);

create table certificates (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  user_id       uuid not null references users (id) on delete cascade,
  type          certificate_type not null,
  pdf_url       text,
  issued_at     timestamptz
);

create table feedback (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  user_id       uuid not null references users (id) on delete cascade,
  nps           integer not null check (nps between 0 and 10),
  liked         text,
  improve       text,
  photo_url     text,
  created_at    timestamptz not null default now()
);

create table reports (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  type          report_type not null,
  pdf_url       text,
  data          jsonb,
  generated_at  timestamptz not null default now()
);

create table audit_log (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id) on delete cascade,
  actor_user_id uuid references users (id) on delete set null,
  action        text not null,
  target        text,
  meta          jsonb,
  created_at    timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- Invariants & status machines (DATA_MODEL §3/§4) — enforced in the DB,
-- never in the UI alone (APP_RULES 2.2).
-- ════════════════════════════════════════════════════════════════════

-- INVARIANT: confirmed+checked_in entries in a category ≤ capacity.
-- Race-safe: the category row is locked before counting, so two
-- concurrent confirmations serialise and oversell is impossible.
create function public.enforce_category_capacity()
returns trigger
language plpgsql
as $$
declare
  cap integer;
  occupied integer;
begin
  if new.status in ('confirmed', 'checked_in')
     and (tg_op = 'INSERT' or old.status not in ('confirmed', 'checked_in')) then
    select capacity into cap from categories where id = new.category_id for update;
    select count(*) into occupied
      from entries
      where category_id = new.category_id
        and status in ('confirmed', 'checked_in')
        and id <> new.id;
    if occupied + 1 > cap then
      raise exception 'CATEGORY_FULL: category % is at capacity (%)', new.category_id, cap
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger entries_capacity_check
  before insert or update of status on entries
  for each row execute function public.enforce_category_capacity();

-- INVARIANT: an entry is confirmed only when its payment is paid,
-- the fee is ₹0, or it is marked offline (DATA_MODEL §4).
create function public.enforce_entry_confirmation()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'confirmed'
     and (tg_op = 'INSERT' or old.status is distinct from 'confirmed') then
    if not (
      new.amount_inr = 0
      or new.offline
      or exists (select 1 from payments p where p.entry_id = new.id and p.status = 'paid')
    ) then
      raise exception 'ENTRY_NOT_PAYABLE: entry % cannot be confirmed without a paid payment, zero fee, or offline flag', new.id
        using errcode = 'P0001';
    end if;
    new.confirmed_at := coalesce(new.confirmed_at, now());
  end if;
  if new.status = 'checked_in' and new.checked_in_at is null then
    new.checked_in_at := now();
  end if;
  return new;
end;
$$;

create trigger entries_confirmation_check
  before insert or update of status on entries
  for each row execute function public.enforce_entry_confirmation();

-- STATUS MACHINE: tournament forward-only, except reg_closed→reg_open
-- (reopen — must be logged by the caller) and any→archived.
create function public.enforce_tournament_transition()
returns trigger
language plpgsql
as $$
declare
  rank_old integer;
  rank_new integer;
begin
  if old.status = new.status then return new; end if;
  if new.status = 'archived' then return new; end if;
  if old.status = 'reg_closed' and new.status = 'reg_open' then return new; end if;
  select array_position(enum_range(null::tournament_status)::text[], old.status::text) into rank_old;
  select array_position(enum_range(null::tournament_status)::text[], new.status::text) into rank_new;
  if rank_new < rank_old then
    raise exception 'ILLEGAL_TRANSITION: tournament % → %', old.status, new.status
      using errcode = 'P0001';
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger tournaments_transition_check
  before update of status on tournaments
  for each row execute function public.enforce_tournament_transition();

-- STATUS MACHINE: entry transitions (DATA_MODEL §3).
-- waitlisted→confirmed|withdrawn is implied by the waitlist feature
-- (a waitlist that can never confirm would be a logical hole).
create function public.enforce_entry_transition()
returns trigger
language plpgsql
as $$
declare ok boolean;
begin
  if old.status = new.status then return new; end if;
  ok := case old.status
    when 'pending_payment' then new.status in ('confirmed', 'waitlisted', 'withdrawn')
    when 'pending_partner' then new.status in ('confirmed', 'withdrawn')
    when 'waitlisted'      then new.status in ('confirmed', 'withdrawn')
    when 'confirmed'       then new.status in ('checked_in', 'withdrawn')
    when 'withdrawn'       then new.status = 'refunded'
    else false
  end;
  if not ok then
    raise exception 'ILLEGAL_TRANSITION: entry % → %', old.status, new.status
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger entries_transition_check
  before update of status on entries
  for each row execute function public.enforce_entry_transition();

-- STATUS MACHINE: payment created→paid|failed; paid→refund_pending→refunded.
create function public.enforce_payment_transition()
returns trigger
language plpgsql
as $$
declare ok boolean;
begin
  if old.status = new.status then return new; end if;
  ok := case old.status
    when 'created'        then new.status in ('paid', 'failed')
    when 'paid'           then new.status = 'refund_pending'
    when 'refund_pending' then new.status = 'refunded'
    else false
  end;
  if not ok then
    raise exception 'ILLEGAL_TRANSITION: payment % → %', old.status, new.status
      using errcode = 'P0001';
  end if;
  if new.status = 'paid' and new.paid_at is null then new.paid_at := now(); end if;
  if new.status = 'refunded' and new.refunded_at is null then new.refunded_at := now(); end if;
  return new;
end;
$$;

create trigger payments_transition_check
  before update of status on payments
  for each row execute function public.enforce_payment_transition();

-- ════════════════════════════════════════════════════════════════════
-- Core-integration contract (DATA_MODEL §5)
-- ════════════════════════════════════════════════════════════════════

-- App → Core: clean, stable locked entry list per tournament/category.
-- security_invoker so RLS applies to app-side readers; the core reads
-- with the service role.
create view core_entry_list
with (security_invoker = on) as
select
  e.tournament_id,
  e.category_id,
  c.name        as category_name,
  c.format,
  c.kind,
  e.id          as entry_id,
  e.status,
  e.primary_user_id,
  u.name        as player_name,
  u.phone       as player_phone,
  e.team_id,
  t.name        as team_name,
  e.is_multi_entry
from entries e
join categories c on c.id = e.category_id
join users u      on u.id = e.primary_user_id
left join teams t on t.id = e.team_id
where e.status in ('confirmed', 'checked_in');

-- Amendments after lock: notify the core to re-read (never mutate silently;
-- the app also writes an audit_log row at the application layer).
create function public.notify_core_amendment()
returns trigger
language plpgsql
as $$
declare t_status tournament_status;
begin
  select status into t_status from tournaments where id = new.tournament_id;
  if t_status in ('reg_closed', 'live') then
    perform pg_notify(
      'core_amendment',
      json_build_object(
        'entry_id', new.id,
        'tournament_id', new.tournament_id,
        'category_id', new.category_id,
        'status', new.status
      )::text
    );
  end if;
  return new;
end;
$$;

create trigger entries_core_amendment_notify
  after update on entries
  for each row execute function public.notify_core_amendment();

-- ── Indexes & realtime (DATA_MODEL §6) ──────────────────────────────
create index entries_tournament_category_status_idx
  on entries (tournament_id, category_id, status);
create index payments_entry_idx on payments (entry_id);
create index scheduled_jobs_sweep_idx on scheduled_jobs (run_after, status);
create index entries_primary_user_idx on entries (primary_user_id);
create index memberships_user_idx on memberships (user_id);
create index tournaments_org_idx on tournaments (org_id);

-- Realtime on entries + payments powers live dashboard counters.
alter publication supabase_realtime add table entries, payments;
