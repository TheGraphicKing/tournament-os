-- ════════════════════════════════════════════════════════════════════
-- Row-Level Security — APP_RULES 1.1 / DATA_MODEL §1 tenancy rules:
--   • memberships gate org data (organiser side)
--   • players see their own entries/payments
--   • public reads only published tournament page data
-- Service role (webhooks, cron sweep, the core) bypasses RLS by design.
-- ════════════════════════════════════════════════════════════════════

-- Helper predicates live in a private schema (not exposed over the API).
-- SECURITY DEFINER so policies on memberships don't recurse into themselves.
create schema if not exists private;

create function private.is_org_member(check_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships
    where org_id = check_org and user_id = auth.uid()
  );
$$;

create function private.has_org_role(check_org uuid, allowed org_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships
    where org_id = check_org and user_id = auth.uid() and role = any (allowed)
  );
$$;

-- Tournament page data is publicly readable once published (never draft/archived).
create function private.tournament_is_public(tid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from tournaments
    where id = tid
      and status in ('published', 'reg_open', 'reg_closed', 'live', 'completed')
  );
$$;

grant usage on schema private to authenticated, anon;
grant execute on all functions in schema private to authenticated, anon;

-- ── Enable RLS everywhere ────────────────────────────────────────────
alter table organisations  enable row level security;
alter table users          enable row level security;
alter table memberships    enable row level security;
alter table tournaments    enable row level security;
alter table categories     enable row level security;
alter table teams          enable row level security;
alter table team_members   enable row level security;
alter table entries        enable row level security;
alter table payments       enable row level security;
alter table announcements  enable row level security;
alter table scheduled_jobs enable row level security;
alter table sponsors       enable row level security;
alter table results        enable row level security;
alter table certificates   enable row level security;
alter table feedback       enable row level security;
alter table reports        enable row level security;
alter table audit_log      enable row level security;

-- ── organisations ────────────────────────────────────────────────────
create policy "members read their org" on organisations
  for select using (
    private.is_org_member(id)
    or exists (
      select 1 from tournaments t
      where t.org_id = organisations.id
        and t.status in ('published', 'reg_open', 'reg_closed', 'live', 'completed')
    )
  );
create policy "owners update their org" on organisations
  for update using (private.has_org_role(id, '{owner}'))
  with check (private.has_org_role(id, '{owner}'));
create policy "owners delete their org" on organisations
  for delete using (private.has_org_role(id, '{owner}'));
-- Creation goes through create_organisation() below (org + owner membership
-- must be atomic), so no direct insert policy.

-- ── users ────────────────────────────────────────────────────────────
create policy "users read own profile" on users
  for select using (id = (select auth.uid()));
create policy "organisers read players in their orgs" on users
  for select using (
    exists (
      select 1 from entries e
      where e.primary_user_id = users.id and private.is_org_member(e.org_id)
    )
    or exists (
      select 1 from team_members tm
      join entries e on e.team_id = tm.team_id
      where tm.user_id = users.id and private.is_org_member(e.org_id)
    )
  );
create policy "users update own profile" on users
  for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ── memberships ──────────────────────────────────────────────────────
create policy "members read org memberships" on memberships
  for select using (
    user_id = (select auth.uid()) or private.is_org_member(org_id)
  );
create policy "owners manage memberships" on memberships
  for all using (private.has_org_role(org_id, '{owner}'))
  with check (private.has_org_role(org_id, '{owner}'));

-- ── tournaments ──────────────────────────────────────────────────────
create policy "members read org tournaments" on tournaments
  for select using (private.is_org_member(org_id));
create policy "public reads published tournaments" on tournaments
  for select using (
    status in ('published', 'reg_open', 'reg_closed', 'live', 'completed')
  );
create policy "managers create tournaments" on tournaments
  for insert with check (private.has_org_role(org_id, '{owner,manager}'));
create policy "managers update tournaments" on tournaments
  for update using (private.has_org_role(org_id, '{owner,manager}'))
  with check (private.has_org_role(org_id, '{owner,manager}'));
create policy "owners delete tournaments" on tournaments
  for delete using (private.has_org_role(org_id, '{owner}'));

-- ── categories (visibility follows the parent tournament) ───────────
create policy "read categories of visible tournaments" on categories
  for select using (
    exists (
      select 1 from tournaments t
      where t.id = categories.tournament_id
        and (
          private.is_org_member(t.org_id)
          or t.status in ('published', 'reg_open', 'reg_closed', 'live', 'completed')
        )
    )
  );
create policy "managers write categories" on categories
  for all using (
    exists (
      select 1 from tournaments t
      where t.id = categories.tournament_id
        and private.has_org_role(t.org_id, '{owner,manager}')
    )
  )
  with check (
    exists (
      select 1 from tournaments t
      where t.id = categories.tournament_id
        and private.has_org_role(t.org_id, '{owner,manager}')
    )
  );

-- ── teams & team_members ─────────────────────────────────────────────
create policy "org members and team members read teams" on teams
  for select using (
    exists (
      select 1 from tournaments t
      where t.id = teams.tournament_id and private.is_org_member(t.org_id)
    )
    or exists (
      select 1 from team_members tm
      where tm.team_id = teams.id and tm.user_id = (select auth.uid())
    )
  );
create policy "org members write teams" on teams
  for all using (
    exists (
      select 1 from tournaments t
      where t.id = teams.tournament_id and private.is_org_member(t.org_id)
    )
  )
  with check (
    exists (
      select 1 from tournaments t
      where t.id = teams.tournament_id and private.is_org_member(t.org_id)
    )
  );

create policy "read own or org team members" on team_members
  for select using (
    user_id = (select auth.uid())
    or exists (
      select 1 from teams tm
      join tournaments t on t.id = tm.tournament_id
      where tm.id = team_members.team_id and private.is_org_member(t.org_id)
    )
    or exists (
      select 1 from team_members me
      where me.team_id = team_members.team_id and me.user_id = (select auth.uid())
    )
  );
create policy "org members write team members" on team_members
  for all using (
    exists (
      select 1 from teams tm
      join tournaments t on t.id = tm.tournament_id
      where tm.id = team_members.team_id and private.is_org_member(t.org_id)
    )
  )
  with check (
    exists (
      select 1 from teams tm
      join tournaments t on t.id = tm.tournament_id
      where tm.id = team_members.team_id and private.is_org_member(t.org_id)
    )
  );

-- ── entries (org staff full read; players see their own) ────────────
create policy "org members read entries" on entries
  for select using (private.is_org_member(org_id));
create policy "players read own entries" on entries
  for select using (
    primary_user_id = (select auth.uid())
    or exists (
      select 1 from team_members tm
      where tm.team_id = entries.team_id and tm.user_id = (select auth.uid())
    )
  );
-- Desk staff create/edit entries at the desk; player self-registration
-- arrives later as a SECURITY DEFINER RPC that computes amount_inr
-- server-side (APP_RULES 2.3). TODO(rizzfitt): register_entry RPC in the
-- registration phase.
create policy "org members create entries" on entries
  for insert with check (private.is_org_member(org_id));
create policy "org members update entries" on entries
  for update using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

-- ── payments (webhook = source of truth; writes via service role only) ─
create policy "org members read payments" on payments
  for select using (private.is_org_member(org_id));
create policy "players read own payments" on payments
  for select using (
    exists (
      select 1 from entries e
      where e.id = payments.entry_id and e.primary_user_id = (select auth.uid())
    )
  );

-- ── announcements (sent ones appear on the public Updates tab) ──────
create policy "org members read announcements" on announcements
  for select using (private.is_org_member(org_id));
create policy "public reads sent announcements" on announcements
  for select using (
    status = 'sent' and private.tournament_is_public(tournament_id)
  );
create policy "managers write announcements" on announcements
  for all using (private.has_org_role(org_id, '{owner,manager}'))
  with check (private.has_org_role(org_id, '{owner,manager}'));

-- ── scheduled_jobs (cron sweep uses the service role) ────────────────
create policy "managers read jobs" on scheduled_jobs
  for select using (private.has_org_role(org_id, '{owner,manager}'));
create policy "managers write jobs" on scheduled_jobs
  for all using (private.has_org_role(org_id, '{owner,manager}'))
  with check (private.has_org_role(org_id, '{owner,manager}'));

-- ── sponsors (approved ones are public page data) ────────────────────
create policy "org members read sponsors" on sponsors
  for select using (private.is_org_member(org_id));
create policy "public reads approved sponsors" on sponsors
  for select using (approved and private.tournament_is_public(tournament_id));
create policy "managers write sponsors" on sponsors
  for all using (private.has_org_role(org_id, '{owner,manager}'))
  with check (private.has_org_role(org_id, '{owner,manager}'));

-- ── results (written by CORE via service role; app reads) ───────────
create policy "read results of visible tournaments" on results
  for select using (
    private.tournament_is_public(tournament_id)
    or exists (
      select 1 from tournaments t
      where t.id = results.tournament_id and private.is_org_member(t.org_id)
    )
  );

-- ── certificates ─────────────────────────────────────────────────────
create policy "players read own certificates" on certificates
  for select using (user_id = (select auth.uid()));
create policy "org members read certificates" on certificates
  for select using (
    exists (
      select 1 from tournaments t
      where t.id = certificates.tournament_id and private.is_org_member(t.org_id)
    )
  );

-- ── feedback ─────────────────────────────────────────────────────────
create policy "players write own feedback" on feedback
  for insert with check (user_id = (select auth.uid()));
create policy "players read own feedback" on feedback
  for select using (user_id = (select auth.uid()));
create policy "org members read feedback" on feedback
  for select using (
    exists (
      select 1 from tournaments t
      where t.id = feedback.tournament_id and private.is_org_member(t.org_id)
    )
  );

-- ── reports ──────────────────────────────────────────────────────────
create policy "managers read reports" on reports
  for select using (
    exists (
      select 1 from tournaments t
      where t.id = reports.tournament_id
        and private.has_org_role(t.org_id, '{owner,manager}')
    )
  );

-- ── audit_log (append-only from the app; no update/delete policies) ──
create policy "managers read audit log" on audit_log
  for select using (private.has_org_role(org_id, '{owner,manager}'));
create policy "members append audit log" on audit_log
  for insert with check (
    private.is_org_member(org_id) and actor_user_id = (select auth.uid())
  );

-- ════════════════════════════════════════════════════════════════════
-- RPC: create an organisation + owner membership atomically.
-- ════════════════════════════════════════════════════════════════════
create function public.create_organisation(org_name text, org_slug text)
returns organisations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org organisations;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  insert into organisations (name, slug, created_by)
  values (org_name, org_slug, auth.uid())
  returning * into new_org;

  insert into memberships (org_id, user_id, role)
  values (new_org.id, auth.uid(), 'owner');

  return new_org;
end;
$$;

revoke execute on function public.create_organisation(text, text) from anon, public;
grant execute on function public.create_organisation(text, text) to authenticated;
