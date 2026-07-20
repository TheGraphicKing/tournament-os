-- pgTAP test: a published tournament's LOCKED entries (confirmed /
-- checked_in) appear in core_entry_list with teams resolved and
-- is_multi_entry flags; non-locked entries do not. DATA_MODEL §5.
--
-- Run with: supabase test db
-- (Each test file runs in a transaction that is rolled back, so the
-- fixtures below never persist.)

begin;
select plan(8);

-- ── Fixtures ─────────────────────────────────────────────────────────
-- auth.users inserts fire handle_new_user(), which mirrors public.users.
insert into auth.users
  (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
   created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000001',
   'authenticated', 'authenticated', 't-owner@test.dev', '{}', '{"name":"T Owner"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000002',
   'authenticated', 'authenticated', 't-rohan@test.dev', '{}', '{"name":"Rohan Test"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000003',
   'authenticated', 'authenticated', 't-meera@test.dev', '{}', '{"name":"Meera Test"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000004',
   'authenticated', 'authenticated', 't-arjun@test.dev', '{}', '{"name":"Arjun Test"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000005',
   'authenticated', 'authenticated', 't-sana@test.dev', '{}', '{"name":"Sana Test"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000006',
   'authenticated', 'authenticated', 't-priya@test.dev', '{}', '{"name":"Priya Test"}',
   now(), now(), '', '', '', '');

insert into organisations (id, name, slug, created_by)
values ('22222222-2222-4222-8222-000000000001', 'Test Club', 'test-club',
        '11111111-1111-4111-8111-000000000001');

-- Published tournament (status set directly on insert; the transition
-- trigger only guards UPDATEs).
insert into tournaments (id, org_id, slug, name, status, refund_policy, published_at)
values ('33333333-3333-4333-8333-000000000001', '22222222-2222-4222-8222-000000000001',
        'test-open', 'Test Open', 'published', 'none', now());

-- Free categories so entries can be inserted already-confirmed (the
-- confirmation trigger allows confirmed when fee is ₹0).
insert into categories (id, tournament_id, name, fee_inr, capacity, format, kind, sort_order)
values
  ('44444444-4444-4444-8444-000000000001', '33333333-3333-4333-8333-000000000001',
   'Singles', 0, 16, 'knockout', 'singles', 1),
  ('44444444-4444-4444-8444-000000000002', '33333333-3333-4333-8333-000000000001',
   'Doubles', 0, 16, 'knockout', 'doubles', 2);

-- Doubles team with one claimed + one unclaimed member (resolved fully).
insert into teams (id, tournament_id, category_id, name)
values ('55555555-5555-4555-8555-000000000001', '33333333-3333-4333-8333-000000000001',
        '44444444-4444-4444-8444-000000000002', 'Test Duo');
insert into team_members (team_id, user_id, claim_status, is_payer) values
  ('55555555-5555-4555-8555-000000000001', '11111111-1111-4111-8111-000000000004', 'claimed', true),
  ('55555555-5555-4555-8555-000000000001', '11111111-1111-4111-8111-000000000005', 'unclaimed', false);

-- Entries: 2 confirmed + 1 checked_in are LOCKED (should appear);
-- 1 pending_payment + 1 withdrawn are NOT (should not appear).
insert into entries (id, org_id, tournament_id, category_id, status, primary_user_id, team_id, amount_inr, is_multi_entry)
values
  -- locked: confirmed singles
  ('66666666-6666-4666-8666-000000000001', '22222222-2222-4222-8222-000000000001',
   '33333333-3333-4333-8333-000000000001', '44444444-4444-4444-8444-000000000001',
   'confirmed', '11111111-1111-4111-8111-000000000002', null, 0, true),
  -- locked: checked_in singles
  ('66666666-6666-4666-8666-000000000002', '22222222-2222-4222-8222-000000000001',
   '33333333-3333-4333-8333-000000000001', '44444444-4444-4444-8444-000000000001',
   'checked_in', '11111111-1111-4111-8111-000000000003', null, 0, false),
  -- locked: confirmed doubles (team resolved)
  ('66666666-6666-4666-8666-000000000003', '22222222-2222-4222-8222-000000000001',
   '33333333-3333-4333-8333-000000000001', '44444444-4444-4444-8444-000000000002',
   'confirmed', '11111111-1111-4111-8111-000000000004',
   '55555555-5555-4555-8555-000000000001', 0, true),
  -- NOT locked: pending_payment
  ('66666666-6666-4666-8666-000000000004', '22222222-2222-4222-8222-000000000001',
   '33333333-3333-4333-8333-000000000001', '44444444-4444-4444-8444-000000000001',
   'pending_payment', '11111111-1111-4111-8111-000000000006', null, 0, false);

-- A withdrawn entry: insert pending, then transition (legal path).
insert into entries (id, org_id, tournament_id, category_id, status, primary_user_id, amount_inr)
values ('66666666-6666-4666-8666-000000000005', '22222222-2222-4222-8222-000000000001',
        '33333333-3333-4333-8333-000000000001', '44444444-4444-4444-8444-000000000001',
        'pending_payment', '11111111-1111-4111-8111-000000000001', 0);
update entries set status = 'withdrawn'
  where id = '66666666-6666-4666-8666-000000000005';

-- ── Assertions ───────────────────────────────────────────────────────

-- 1. Exactly the 3 locked entries appear for this tournament.
select is(
  (select count(*)::int from core_entry_list
   where tournament_id = '33333333-3333-4333-8333-000000000001'),
  3,
  'core_entry_list returns exactly the 3 locked (confirmed/checked_in) entries'
);

-- 2. The confirmed singles entry is present.
select ok(
  exists (select 1 from core_entry_list
          where entry_id = '66666666-6666-4666-8666-000000000001'),
  'confirmed entry appears in core_entry_list'
);

-- 3. The checked_in entry is present.
select ok(
  exists (select 1 from core_entry_list
          where entry_id = '66666666-6666-4666-8666-000000000002'),
  'checked_in entry appears in core_entry_list'
);

-- 4. The pending_payment entry is absent.
select ok(
  not exists (select 1 from core_entry_list
              where entry_id = '66666666-6666-4666-8666-000000000004'),
  'pending_payment entry does NOT appear in core_entry_list'
);

-- 5. The withdrawn entry is absent.
select ok(
  not exists (select 1 from core_entry_list
              where entry_id = '66666666-6666-4666-8666-000000000005'),
  'withdrawn entry does NOT appear in core_entry_list'
);

-- 6. is_multi_entry flag surfaces correctly.
select is(
  (select is_multi_entry from core_entry_list
   where entry_id = '66666666-6666-4666-8666-000000000001'),
  true,
  'is_multi_entry flag is exposed for the core'
);

-- 7. Teams are resolved: the doubles entry carries both roster members.
select is(
  (select jsonb_array_length(team_members) from core_entry_list
   where entry_id = '66666666-6666-4666-8666-000000000003'),
  2,
  'doubles entry resolves its full team roster (claimed + unclaimed)'
);

-- 8. Singles entries carry an empty roster (not null).
select is(
  (select jsonb_array_length(team_members) from core_entry_list
   where entry_id = '66666666-6666-4666-8666-000000000001'),
  0,
  'singles entry has an empty (not null) team roster'
);

select * from finish();
rollback;
