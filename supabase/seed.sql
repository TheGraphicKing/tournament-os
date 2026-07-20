-- ════════════════════════════════════════════════════════════════════
-- Seed: demo org + sample tournament (local/dev only — run via
-- `supabase db reset`, never against production).
-- Demo logins (email magic link or password 'demo-password' locally).
-- ════════════════════════════════════════════════════════════════════

-- ── Demo auth users (mirrored into public.users by trigger) ─────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'owner@rizzfitt.demo',
   extensions.crypt('demo-password', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Asha Owner"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'desk@rizzfitt.demo',
   extensions.crypt('demo-password', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Dev Desk"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'rohan@player.demo',
   extensions.crypt('demo-password', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Rohan Iyer"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'meera@player.demo',
   extensions.crypt('demo-password', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Meera Nair"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-000000000003',
   'authenticated', 'authenticated', 'arjun@player.demo',
   extensions.crypt('demo-password', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Arjun Menon"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-000000000004',
   'authenticated', 'authenticated', 'sana@player.demo',
   extensions.crypt('demo-password', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Sana Sheikh"}', now(), now(), '', '', '', '');

update public.users set phone = '+919800000001' where id = 'b0000000-0000-4000-8000-000000000001';
update public.users set phone = '+919800000002' where id = 'b0000000-0000-4000-8000-000000000002';

-- ── Demo organisation + memberships ──────────────────────────────────
insert into organisations (id, name, slug, created_by)
values ('c0000000-0000-4000-8000-000000000001', 'RizzFitt Sports Club', 'rizzfitt-demo',
        'a0000000-0000-4000-8000-000000000001');

insert into memberships (org_id, user_id, role) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'owner'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'desk');

-- ── Sample tournament (reg open) ─────────────────────────────────────
insert into tournaments (
  id, org_id, slug, name, status, venue_name, venue_maps_url, city,
  start_date, end_date, theme, reg_opens_at, reg_closes_at,
  refund_policy, waitlist_enabled, contact_whatsapp, show_whatsapp,
  about_md, rules_md, faqs, published_at
)
values (
  'd0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'rizzfitt-open-2026',
  'RizzFitt Pickleball Open 2026',
  'reg_open',
  'Marina Indoor Courts', 'https://maps.google.com/?q=Marina+Indoor+Courts', 'Chennai',
  '2026-07-18', '2026-07-19',
  '{"accent":"#F16C1D","accent_press":"#D75E14","ink":"#121212","surface":"#FFFFFF","on_accent":"#FFFFFF"}',
  '2026-06-01T04:30:00Z', '2026-07-10T18:29:00Z',
  'full_d7', true, '+919800000099', true,
  'Two days of pickleball across singles, doubles and team formats. All skill levels welcome.',
  '- USA Pickleball rules apply\n- Best of 3 games to 11, win by 2\n- 5-minute default for no-shows',
  '[{"q":"Is there parking?","a":"Yes, free parking at the venue."},{"q":"Are paddles provided?","a":"Bring your own; demo paddles at the desk."}]',
  '2026-06-01T04:30:00Z'
);

insert into categories (id, tournament_id, name, fee_inr, capacity, format, kind, sort_order) values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Men''s Singles — Open', 799, 32, 'knockout', 'singles', 1),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001',
   'Mixed Doubles — Open', 1199, 16, 'knockout', 'doubles', 2),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001',
   'Community Team League (Free)', 0, 8, 'league', 'team', 3);

-- ── Team for the doubles entry (one partner not yet claimed) ─────────
insert into teams (id, tournament_id, category_id, name) values
  ('f0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000002', 'Smash Bros');

insert into team_members (team_id, user_id, claim_status, is_payer) values
  ('f0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'claimed', true),
  ('f0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004', 'unclaimed', false);

-- ── Entries (inserted pending, then transitioned legally) ────────────
insert into entries (id, org_id, tournament_id, category_id, status, primary_user_id, amount_inr, is_multi_entry) values
  -- Rohan: singles, will be confirmed via a paid payment
  ('10000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'pending_payment', 'b0000000-0000-4000-8000-000000000001', 799, false),
  -- Meera: singles, payment still open
  ('10000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'pending_payment', 'b0000000-0000-4000-8000-000000000002', 799, false),
  -- Sana: free team league, confirmed immediately (₹0 skips checkout)
  ('10000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003',
   'confirmed', 'b0000000-0000-4000-8000-000000000004', 0, false);

-- Arjun: mixed doubles, waiting on his partner to claim (multi-entry flag on)
insert into entries (id, org_id, tournament_id, category_id, status, primary_user_id, team_id, amount_inr, is_multi_entry) values
  ('10000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002',
   'pending_partner', 'b0000000-0000-4000-8000-000000000003',
   'f0000000-0000-4000-8000-000000000001', 1199, true);

-- Desk-recorded cash entry (offline, never silent — note required by convention)
insert into entries (id, org_id, tournament_id, category_id, status, primary_user_id, amount_inr, offline, note) values
  ('10000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'confirmed', 'b0000000-0000-4000-8000-000000000003', 799, true,
   'Cash collected at desk by Dev — receipt #042');

-- ── Payments (webhook is the source of truth for paid) ───────────────
insert into payments (id, org_id, entry_id, razorpay_order_id, razorpay_payment_id, amount_inr, status, paid_at) values
  ('20000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', 'order_DEMO0000000001', 'pay_DEMO0000000001',
   799, 'paid', now());

insert into payments (id, org_id, entry_id, razorpay_order_id, amount_inr, status) values
  ('20000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000002', 'order_DEMO0000000002', 799, 'created');

-- Legal transition: pending_payment → confirmed (payment above is paid)
update entries set status = 'confirmed'
where id = '10000000-0000-4000-8000-000000000001';

-- ── Comms, sponsors, jobs, audit ─────────────────────────────────────
insert into announcements (org_id, tournament_id, segment, channel, subject, body_md, status, sent_at) values
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'all', 'email', 'Registration is open!',
   'Early-bird pricing closes **June 30**. See you on court!', 'sent', now());

insert into sponsors (org_id, tournament_id, name, tier, link, suggested, approved) values
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Marina Sports Co', 'title', 'https://example.com/marina-sports', false, true);

insert into scheduled_jobs (org_id, type, payload, run_after) values
  ('c0000000-0000-4000-8000-000000000001', 'reminder_d7',
   '{"tournament_id":"d0000000-0000-4000-8000-000000000001","template":"d7"}',
   '2026-07-11T04:30:00Z');

insert into audit_log (org_id, actor_user_id, action, target, meta) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'entry.mark_offline_paid', 'entries:10000000-0000-4000-8000-000000000005',
   '{"reason":"Cash at desk, receipt #042"}');
