-- ════════════════════════════════════════════════════════════════════
-- Flow O — organiser onboarding (USER_FLOWS.md). Adds what O2 needs:
-- an org city, a public logo storage bucket, and a richer atomic
-- create_organisation RPC (auto-slug deduped + city + logo).
-- ════════════════════════════════════════════════════════════════════

-- O2 collects a city for the organisation. DATA_MODEL §2 doesn't list it,
-- so this extends the model.
-- TODO(rizzfitt): confirm org.city lives on organisations vs. being
-- derived from the first tournament — added here because onboarding O2
-- captures it before any tournament exists.
alter table organisations add column city text;

-- ── Logo storage bucket ──────────────────────────────────────────────
-- Public read (logos appear on public event pages); owners write only
-- inside their own user-id folder so one org can't overwrite another's.
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

create policy "public read org logos" on storage.objects
  for select using (bucket_id = 'org-logos');

create policy "owners upload org logos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners update org logos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners delete org logos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── create_organisation: name → deduped slug, city, logo, owner ──────
-- Replaces the 2-arg version from migration 2.
drop function if exists public.create_organisation(text, text);

create function public.create_organisation(
  org_name text,
  org_slug text,
  org_city text default null,
  org_logo_url text default null
)
returns organisations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org   organisations;
  base_slug text;
  candidate text;
  n         int := 1;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  base_slug := nullif(trim(org_slug), '');
  if base_slug is null then
    raise exception 'SLUG_REQUIRED' using errcode = 'P0001';
  end if;

  -- Dedupe the slug under the unique constraint (closes the duplicate-name
  -- hole: two "Marina Club"s become marina-club, marina-club-2, …).
  candidate := base_slug;
  while exists (select 1 from organisations where slug = candidate) loop
    n := n + 1;
    candidate := base_slug || '-' || n;
  end loop;

  insert into organisations (name, slug, city, logo_url, created_by)
  values (org_name, candidate, nullif(trim(org_city), ''), org_logo_url, auth.uid())
  returning * into new_org;

  insert into memberships (org_id, user_id, role)
  values (new_org.id, auth.uid(), 'owner');

  return new_org;
end;
$$;

revoke execute on function public.create_organisation(text, text, text, text) from anon, public;
grant execute on function public.create_organisation(text, text, text, text) to authenticated;
