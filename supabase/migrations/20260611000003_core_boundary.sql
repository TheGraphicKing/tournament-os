-- ════════════════════════════════════════════════════════════════════
-- Core-integration boundary (DATA_MODEL §5) — App ⇄ live-scoring core.
--   App → Core: core_entry_list (locked entries, teams resolved).
--   Core → App: matches + results (core writes, app reads-mostly).
--   Amendments: NOTIFY on post-lock audit_log rows so the core re-reads.
--
-- TODO(rizzfitt): Phase-0 decision with the core dev partner — shared
-- Postgres (this file) vs. a separate service behind the REST contract in
-- src/app/api/core/*. If shared DB, the core reads core_entry_list and
-- writes matches/results directly with the service role; the REST routes
-- are the fallback for the separate-service case. The view + table shapes
-- are identical either way, so the contract is stable regardless.
-- ════════════════════════════════════════════════════════════════════

-- ── core_entry_list: resolve teams fully ─────────────────────────────
-- The original view returned only team_id/team_name. The core needs every
-- roster member (both partners for doubles, with claim + payer flags) to
-- schedule, so we aggregate team_members into the row. One row per locked
-- entry; deterministic order = stable shape across reads.
drop view if exists core_entry_list;

create view core_entry_list
with (security_invoker = on) as
select
  e.tournament_id,
  e.category_id,
  c.name              as category_name,
  c.format,
  c.kind,
  c.sort_order        as category_sort_order,
  e.id                as entry_id,
  e.status,
  e.is_multi_entry,
  e.primary_user_id,
  u.name              as player_name,
  u.phone             as player_phone,
  e.team_id,
  t.name              as team_name,
  -- Full roster for doubles/team entries; [] for singles. Unclaimed
  -- members are kept (flagged), never dropped (DATA_MODEL §4).
  coalesce(
    (
      select jsonb_agg(
               jsonb_build_object(
                 'user_id', tm.user_id,
                 'name', mu.name,
                 'phone', mu.phone,
                 'claim_status', tm.claim_status,
                 'is_payer', tm.is_payer
               )
               order by tm.is_payer desc, mu.name
             )
      from team_members tm
      join users mu on mu.id = tm.user_id
      where tm.team_id = e.team_id
    ),
    '[]'::jsonb
  )                   as team_members,
  e.confirmed_at,
  e.checked_in_at
from entries e
join categories c on c.id = e.category_id
join users u      on u.id = e.primary_user_id
left join teams t on t.id = e.team_id
where e.status in ('confirmed', 'checked_in')
order by c.sort_order, c.id, e.created_at;

comment on view core_entry_list is
  'App → Core handoff at reg_closed: locked (confirmed/checked_in) entries '
  'with teams resolved and is_multi_entry flags. Stable shape — see DATA_MODEL §5.';

-- ── matches: written by the CORE, app reads-mostly (DATA_MODEL §4/§5) ─
-- Columns are not fully specified in DATA_MODEL (only "schedule, court,
-- time, live score"); this is a reasonable stub.
-- TODO(rizzfitt): confirm exact columns/score shape with the core dev partner.
create type match_status as enum ('scheduled', 'live', 'completed', 'cancelled');

create table matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  category_id   uuid not null references categories (id) on delete cascade,
  -- Sides reference entries (singles) or teams (doubles/team). Nullable
  -- because brackets can hold TBD slots before both sides are known.
  home_entry_id uuid references entries (id) on delete set null,
  away_entry_id uuid references entries (id) on delete set null,
  home_team_id  uuid references teams (id) on delete set null,
  away_team_id  uuid references teams (id) on delete set null,
  round         text,                       -- e.g. 'R32', 'QF', 'Final'
  court         text,
  scheduled_at  timestamptz,
  status        match_status not null default 'scheduled',
  score         jsonb,                      -- game/point detail, core's shape
  live_score    jsonb,                      -- volatile in-progress score
  winner_side   text,                       -- 'home' | 'away' | null
  starts_label  text,                       -- human slot label, optional
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index matches_tournament_idx on matches (tournament_id, category_id);
create index matches_schedule_idx on matches (tournament_id, scheduled_at);

-- ── RLS for matches: public reads visible tournaments; org staff read ─
-- their org's. Writes are CORE-only (service role bypasses RLS) — no
-- insert/update/delete policy means no authenticated client can write.
alter table matches enable row level security;

create policy "read matches of visible tournaments" on matches
  for select using (
    private.tournament_is_public(tournament_id)
    or exists (
      select 1 from tournaments t
      where t.id = matches.tournament_id and private.is_org_member(t.org_id)
    )
  );

-- ── Amendment NOTIFY on audit_log (DATA_MODEL §5) ────────────────────
-- Post-lock amendments go through a logged audit_log row; this fires a
-- re-read signal to the core. Complements the entries trigger (which
-- catches the status mutation itself) — here the durable amendment record
-- is the source of the notification.
create function public.notify_core_amendment_logged()
returns trigger
language plpgsql
as $$
declare
  tid uuid;
  t_status tournament_status;
begin
  -- Only amendment-type audit rows concern the core.
  if new.action not ilike '%amend%' then
    return new;
  end if;

  -- tournament_id may be carried in meta; fall back to parsing the target
  -- ('entries:<uuid>') and looking up the entry's tournament.
  tid := nullif(new.meta ->> 'tournament_id', '')::uuid;
  if tid is null and new.target like 'entries:%' then
    select tournament_id into tid
    from entries
    where id = split_part(new.target, ':', 2)::uuid;
  end if;

  if tid is not null then
    select status into t_status from tournaments where id = tid;
    if t_status in ('reg_closed', 'live') then
      perform pg_notify(
        'core_amendment',
        json_build_object(
          'source', 'audit_log',
          'audit_id', new.id,
          'tournament_id', tid,
          'action', new.action,
          'target', new.target,
          'meta', new.meta
        )::text
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger audit_log_core_amendment_notify
  after insert on audit_log
  for each row execute function public.notify_core_amendment_logged();

-- One standings row per category (lets the REST fallback upsert on conflict).
create unique index results_tournament_category_uniq
  on results (tournament_id, category_id);

-- Realtime on matches + results powers the public live & results pages.
alter publication supabase_realtime add table matches, results;
