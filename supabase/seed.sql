-- =====================================================================
-- ISTE – Easwari Student Chapter: Seed Data
-- 
-- Where to run this:
-- 1. In the Supabase Cloud Dashboard: Paste and run in the SQL Editor.
-- 2. With Supabase CLI: Automatically runs on `supabase db reset`.
-- =====================================================================

-- 1. Membership Settings (headline, fees, perks)
insert into membership_settings (id, is_open, headline, intro, price_label, price_note, perks)
values (
  1,
  true,
  'Join ISTE Easwari Student Chapter',
  'Be part of a thriving technical community, participate in exclusive workshops, hackathons, and expand your professional network.',
  'Rs. 350',
  'Valid for one academic year',
  '["Free access to regular technical workshops", "Priority registration for flagship hackathons", "Exclusive member-only discounts on paid events", "Official membership certificate and ID card", "Mentorship and career development sessions"]'::jsonb
)
on conflict (id) do update set
  is_open = excluded.is_open,
  headline = excluded.headline,
  intro = excluded.intro,
  price_label = excluded.price_label,
  price_note = excluded.price_note,
  perks = excluded.perks;

-- 2. Current Academic Tenure
insert into tenures (id, label, start_date, end_date, is_current)
values (
  '11111111-1111-1111-1111-111111111111',
  '2026 - 2027',
  '2026-06-01',
  '2027-05-31',
  true
)
on conflict do nothing;

-- 3. Domains / Wings
insert into domains (id, name, tagline, description, sort_order)
values
  ('22222222-2222-2222-2222-222222222221', 'Technical Wing', 'Code, Build, Innovate', 'Drives software development, competitive programming, and technical workshops.', 1),
  ('22222222-2222-2222-2222-222222222222', 'Events & Operations', 'Seamless Execution', 'Manages logistics, venue planning, and end-to-end event execution.', 2),
  ('22222222-2222-2222-2222-222222222223', 'Design & Media', 'Visuals that Speak', 'Creates branding, social media content, visual posters, and event photography.', 3),
  ('22222222-2222-2222-2222-222222222224', 'Public Relations & Marketing', 'Connecting Communities', 'Handles outreach, sponsorships, social media presence, and inter-college networking.', 4)
on conflict (name) do nothing;

-- 4. Sample Team Members
insert into team_members (domain_id, tenure_id, name, role, is_head, year, department, bio, sort_order)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'President Name', 'President', true, 'IV', 'CSE', 'Passionate about engineering education and student leadership.', 1),
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Tech Lead Name', 'Technical Head', true, 'III', 'IT', 'Full-stack developer and open source enthusiast.', 2),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Events Head Name', 'Events Lead', true, 'III', 'ECE', 'Coordinator for all student events and symposia.', 3)
on conflict do nothing;

-- 5. Sample Events
insert into events (id, title, description, location, venue, starts_at, ends_at, status, member_discount_pct, member_opens_at, public_opens_at)
values
  (
    '33333333-3333-3333-3333-333333333331',
    'HackNova 2026: 24-Hour Chapter Hackathon',
    'A 24-hour inter-college hackathon focusing on AI, Web3, and Open Innovation. Mentorship, cash prizes, and swags for all finalists.',
    'Campus Auditorium',
    'Easwari Engineering College',
    now() + interval '14 days',
    now() + interval '15 days',
    'upcoming',
    50,
    now() - interval '2 days',
    now() + interval '1 day'
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    'Hands-on Cloud & DevOps Bootcamp',
    'Learn Docker, Kubernetes, and CI/CD pipelines with industry practitioners.',
    'Seminar Hall 2',
    'Easwari Engineering College',
    now() + interval '30 days',
    now() + interval '30 days' + interval '4 hours',
    'upcoming',
    100,
    now(),
    now() + interval '5 days'
  )
on conflict do nothing;

-- 6. Announcements / Pinboard
insert into announcements (title, body, display_order, is_active)
values
  ('Annual Chapter Registrations Open', 'Registrations for the 2026-2027 academic tenure are officially open. Check the membership tab to sign up!', 1, true),
  ('Call for Core Team Volunteers', 'Interested in joining our design and event management teams? Reach out to domain leads.', 2, true)
on conflict do nothing;

-- 7. Skill Zone (Quizzes)
insert into quizzes (id, title, topic, is_live)
values
  ('44444444-4444-4444-4444-444444444441', 'Web & Cloud Architecture Quiz', 'Web Development', true)
on conflict do nothing;

insert into quiz_questions (quiz_id, prompt, options, correct_index, explanation, sort_order)
values
  (
    '44444444-4444-4444-4444-444444444441',
    'Which HTTP status code signifies "Created"?',
    '["200 OK", "201 Created", "204 No Content", "400 Bad Request"]'::jsonb,
    1,
    'HTTP 201 indicates that the request was successful and resulted in the creation of a new resource.',
    1
  ),
  (
    '44444444-4444-4444-4444-444444444441',
    'In PostgreSQL, what clause is used to handle upserts?',
    '["ON DUPLICATE KEY", "ON CONFLICT", "UPSERT INTO", "MERGE RECORD"]'::jsonb,
    1,
    'PostgreSQL uses ON CONFLICT (column) DO UPDATE/NOTHING for upsert semantics.',
    2
  )
on conflict do nothing;

-- 8. Default Test Member for QR-code Verification
-- Idempotent upsert on member_code: ISTE-EEC-2026-UDQQU
insert into members (
  id,
  full_name,
  email,
  reg_no,
  department,
  section,
  year,
  member_code,
  status,
  valid_from,
  valid_till,
  account_claimed,
  created_by_admin
)
values (
  '00000000-0000-0000-0000-000000000310',
  'REHAN',
  'REHAN@GMAIL.COM',
  '310',
  'CSE',
  'E',
  'II',
  'ISTE-EEC-2026-UDQQU',
  'active',
  '2026-06-30',
  '2027-06-29',
  true,
  true
)
on conflict (member_code) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  reg_no = excluded.reg_no,
  department = excluded.department,
  section = excluded.section,
  year = excluded.year,
  status = excluded.status,
  valid_from = excluded.valid_from,
  valid_till = excluded.valid_till,
  account_claimed = excluded.account_claimed,
  created_by_admin = excluded.created_by_admin;

-- Ensure public verify_member RPC function is available for phone scanner and web verification
create or replace function public.verify_member(p_member_code text)
returns table (
  full_name text,
  email text,
  reg_no text,
  department text,
  section text,
  year text,
  photo_url text,
  member_code text,
  status text,
  valid_from date,
  valid_till date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    m.full_name,
    m.email,
    m.reg_no,
    m.department,
    m.section,
    m.year,
    m.photo_url,
    m.member_code,
    m.status::text,
    m.valid_from,
    m.valid_till
  from public.members m
  where lower(m.member_code) = lower(trim(p_member_code))
     or (
       p_member_code ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and m.id = p_member_code::uuid
     )
  limit 1;
end;
$$;

grant execute on function public.verify_member(text) to anon, authenticated;
