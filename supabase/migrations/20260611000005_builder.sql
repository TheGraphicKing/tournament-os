-- ════════════════════════════════════════════════════════════════════
-- Tournament Builder (new product area) — storage for Briefs and their
-- generated outputs. MVP has no login (§3: no multi-user roles), so a
-- Brief is reached by its id + a secret edit_token, both returned at
-- creation. Direct table access is blocked by RLS; all access flows
-- through SECURITY DEFINER RPCs that check the token. This keeps briefs
-- private (you can't list the table) without forcing a sign-in.
-- ════════════════════════════════════════════════════════════════════

create table builder_briefs (
  id              uuid primary key default gen_random_uuid(),
  edit_token      uuid not null default gen_random_uuid(),
  brief           jsonb not null,
  generation_spec jsonb,
  outputs         jsonb not null default '{}'::jsonb,  -- landing/email/marketing (later phases)
  status          text not null default 'draft',
  -- Optional link to a signed-in organiser, if one is present. Never
  -- required (anonymous builds are first-class).
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table builder_briefs enable row level security;
-- No policies for anon/authenticated → no direct reads or writes. The
-- RPCs below (SECURITY DEFINER) are the only door in.

-- ── create ───────────────────────────────────────────────────────────
create function public.builder_create_brief(p_brief jsonb, p_spec jsonb)
returns table (id uuid, edit_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_row builder_briefs;
begin
  insert into builder_briefs (brief, generation_spec, created_by)
  values (p_brief, p_spec, auth.uid())
  returning * into new_row;
  id := new_row.id;
  edit_token := new_row.edit_token;
  return next;
end;
$$;

-- ── load (token-gated) ───────────────────────────────────────────────
create function public.builder_load_brief(p_id uuid, p_token uuid)
returns builder_briefs
language plpgsql
security definer
set search_path = public
as $$
declare
  row builder_briefs;
begin
  select * into row from builder_briefs
  where id = p_id and edit_token = p_token;
  if not found then
    raise exception 'NOT_FOUND_OR_BAD_TOKEN' using errcode = 'P0001';
  end if;
  return row;
end;
$$;

-- ── save / regenerate (token-gated) ──────────────────────────────────
create function public.builder_save_brief(
  p_id uuid,
  p_token uuid,
  p_brief jsonb,
  p_spec jsonb
)
returns builder_briefs
language plpgsql
security definer
set search_path = public
as $$
declare
  row builder_briefs;
begin
  update builder_briefs
     set brief = p_brief,
         generation_spec = p_spec,
         updated_at = now()
   where id = p_id and edit_token = p_token
  returning * into row;
  if not found then
    raise exception 'NOT_FOUND_OR_BAD_TOKEN' using errcode = 'P0001';
  end if;
  return row;
end;
$$;

-- ── store generated outputs (token-gated; used by later phases) ──────
create function public.builder_set_outputs(
  p_id uuid,
  p_token uuid,
  p_outputs jsonb,
  p_status text default 'ready'
)
returns builder_briefs
language plpgsql
security definer
set search_path = public
as $$
declare
  row builder_briefs;
begin
  update builder_briefs
     set outputs = p_outputs,
         status = p_status,
         updated_at = now()
   where id = p_id and edit_token = p_token
  returning * into row;
  if not found then
    raise exception 'NOT_FOUND_OR_BAD_TOKEN' using errcode = 'P0001';
  end if;
  return row;
end;
$$;

-- ── Logo storage for anonymous builds ───────────────────────────────
-- Public read (logos appear on the generated site/emails). Anonymous
-- organisers can upload (no login in the builder MVP); files are keyed by
-- a random uuid path chosen client-side.
insert into storage.buckets (id, name, public)
values ('builder-logos', 'builder-logos', true)
on conflict (id) do nothing;

create policy "public read builder logos" on storage.objects
  for select using (bucket_id = 'builder-logos');
create policy "anyone upload builder logos" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'builder-logos');

-- Anonymous organisers can build; the token is the capability.
grant execute on function public.builder_create_brief(jsonb, jsonb) to anon, authenticated;
grant execute on function public.builder_load_brief(uuid, uuid) to anon, authenticated;
grant execute on function public.builder_save_brief(uuid, uuid, jsonb, jsonb) to anon, authenticated;
grant execute on function public.builder_set_outputs(uuid, uuid, jsonb, text) to anon, authenticated;
