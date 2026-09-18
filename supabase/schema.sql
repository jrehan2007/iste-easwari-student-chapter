-- =====================================================================
-- ISTE – Easwari Student Chapter
-- Complete database schema. Run this once in the Supabase SQL Editor.
--
-- Already ran an earlier version? Run supabase/reset.sql first, then this.
-- =====================================================================

do $$ begin
  create type user_role     as enum ('admin', 'member');
  create type event_status  as enum ('upcoming', 'ongoing', 'past');
  create type member_status as enum ('pending', 'active', 'expired', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- people
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text unique not null,
  role user_role not null default 'member',
  created_at timestamptz default now()
);

create table if not exists admin_allowlist (
  email text primary key,
  note text,
  added_at timestamptz default now()
);

-- ---------------------------------------------------------------- leadership
create table if not exists tenures (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz default now(),
  constraint tenure_dates_valid check (end_date >= start_date)
);

create unique index if not exists one_current_tenure on tenures (is_current)
  where is_current = true;

create table if not exists domains (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  tagline text,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains on delete set null,
  tenure_id uuid not null references tenures on delete cascade,
  name text not null,
  role text,
  is_head boolean default false,
  year text,
  department text,
  bio text,
  photo_url text,
  linkedin_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------- membership
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles on delete cascade,
  full_name text not null,
  email text not null,
  reg_no text not null,
  department text,
  section text,
  year text,
  photo_url text,
  member_code text unique not null,
  status member_status not null default 'pending',
  valid_from date,
  valid_till date,
  temp_password text,
  must_change_password boolean default false,
  account_claimed boolean default false,
  created_by_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists membership_settings (
  id int primary key default 1,
  is_open boolean default false,
  headline text default 'Membership',
  intro text,
  closed_message text default 'Membership registration is currently closed. Watch the pin board for the next intake.',
  price_label text default 'Rs. 350',
  price_note text default 'Valid for one academic year.',
  google_form_url text,
  perks jsonb default '[]'::jsonb,
  opens_on date,
  closes_on date,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

insert into membership_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------- events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  banner_url text,
  location text,
  venue text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status event_status not null default 'upcoming',
  google_form_url text,
  member_discount_pct int default 0,
  member_opens_at timestamptz,
  public_opens_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists event_passes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events on delete cascade,
  token text unique not null,
  leader_name text,
  leader_email text not null,
  team_name text,
  team_size int default 1,
  track text,
  room text,
  lane text not null default 'public',
  member_id uuid references members on delete set null,
  issued_at timestamptz default now(),
  expires_at timestamptz not null,
  emailed_at timestamptz,
  checked_in_at timestamptz,
  checked_in_by uuid references profiles
);

create index if not exists event_passes_event_idx on event_passes (event_id);
create index if not exists event_passes_token_idx on event_passes (token);

-- ---------------------------------------------------------------- content
create table if not exists gallery_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_url text,
  event_id uuid references events on delete set null,
  created_at timestamptz default now()
);

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references gallery_folders on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamptz default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_url text,
  source text default 'chapter',
  external_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null default 'newsletter',
  file_url text,
  external_url text,
  published_on date default current_date,
  created_at timestamptz default now()
);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members on delete cascade,
  event_id uuid references events on delete set null,
  pass_id uuid references event_passes on delete set null,
  event_title text not null,
  certificate_type text not null default 'Participation' check (certificate_type in ('Merit', 'Participation')),
  rank text check (rank in ('1st Prize', '2nd Prize', '3rd Prize', 'Excellence')),
  recipient_name text,
  recipient_email text,
  file_url text not null,
  issued_on date default current_date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

alter table certificates add column if not exists certificate_type text not null default 'Participation';
alter table certificates add column if not exists rank text;
alter table certificates add column if not exists status text not null default 'pending';

-- ---------------------------------------------------------------- skill zone
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  topic text,
  is_live boolean default false,
  created_at timestamptz default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text,
  sort_order int default 0
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes on delete cascade,
  member_id uuid references members on delete cascade,
  score int,
  total int,
  attempted_at timestamptz default now()
);

-- =====================================================================
-- Functions
-- =====================================================================

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function set_current_tenure(p_tenure_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admin access required'; end if;
  update tenures set is_current = false where is_current = true;
  update tenures set is_current = true where id = p_tenure_id;
  if not found then raise exception 'Tenure not found'; end if;
end;
$$;

create or replace function is_active_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where profile_id = auth.uid() and status = 'active');
$$;

create or replace function verify_member(p_member_code text)
returns table (
  full_name text, reg_no text, department text, section text, year text,
  photo_url text, member_code text, valid_from date, valid_till date
)
language sql security definer set search_path = public as $$
  select m.full_name, m.reg_no, m.department, m.section, m.year,
         m.photo_url, m.member_code, m.valid_from, m.valid_till
    from members m
   where m.member_code = p_member_code
     and m.status = 'active'
     and (m.valid_till is null or m.valid_till >= current_date);
$$;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'member')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function enforce_admin_allowlist() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'admin'
     and not exists (select 1 from admin_allowlist where lower(email) = lower(new.email)) then
    raise exception 'This email is not authorised for admin access';
  end if;
  return new;
end;
$$;

drop trigger if exists check_admin_allowlist on profiles;
create trigger check_admin_allowlist
  before insert or update on profiles
  for each row execute function enforce_admin_allowlist();

create or replace function member_temp_login(p_email text, p_temp text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from members
    where lower(email) = lower(p_email)
      and temp_password = p_temp
      and account_claimed = false
      and status = 'active'
  );
$$;

create or replace function member_claim_complete(p_email text, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update members
     set profile_id = p_user, account_claimed = true,
         must_change_password = false, temp_password = null
   where lower(email) = lower(p_email);
end;
$$;

create or replace function scan_pass(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p record; begin
  if not is_admin() then return jsonb_build_object('result','forbidden'); end if;

  select ep.*, e.title as event_title into p
    from event_passes ep left join events e on e.id = ep.event_id
   where ep.token = p_token;

  if p is null then return jsonb_build_object('result','unknown'); end if;

  if p.expires_at < now() then
    return jsonb_build_object('result','expired','expires_at',p.expires_at,'team_name',p.team_name);
  end if;

  if p.checked_in_at is not null then
    return jsonb_build_object('result','already','checked_in_at',p.checked_in_at,
                              'team_name',p.team_name,'lane',p.lane);
  end if;

  update event_passes set checked_in_at = now(), checked_in_by = auth.uid() where id = p.id;

  return jsonb_build_object('result','valid','team_name',p.team_name,
    'leader_name',p.leader_name,'leader_email',p.leader_email,'team_size',p.team_size,
    'room',p.room,'track',p.track,'lane',p.lane,'event_title',p.event_title);
end;
$$;

grant execute on function member_temp_login(text, text)     to anon, authenticated;
grant execute on function member_claim_complete(text, uuid) to authenticated;
grant execute on function scan_pass(text)                   to authenticated;
grant execute on function verify_member(text)               to anon, authenticated;

-- =====================================================================
-- Row level security
-- =====================================================================

alter table profiles            enable row level security;
alter table admin_allowlist     enable row level security;
alter table domains             enable row level security;
alter table tenures             enable row level security;
alter table team_members        enable row level security;
alter table members             enable row level security;
alter table membership_settings enable row level security;
alter table events              enable row level security;
alter table event_passes        enable row level security;
alter table gallery_folders     enable row level security;
alter table gallery_photos      enable row level security;
alter table announcements       enable row level security;
alter table feedback            enable row level security;
alter table resources           enable row level security;
alter table certificates        enable row level security;
alter table quizzes             enable row level security;
alter table quiz_questions      enable row level security;
alter table quiz_attempts       enable row level security;

create policy "read domains"   on domains      for select using (true);
create policy "read tenures"   on tenures      for select using (true);
create policy "read team"      on team_members for select using (true);
create policy "read folders"   on gallery_folders for select using (true);
create policy "read photos"    on gallery_photos  for select using (true);
create policy "read posts"     on announcements   for select using (true);
create policy "read settings"  on membership_settings for select using (true);

create policy "read events by audience" on events for select using (
  (public_opens_at is null or public_opens_at <= now())
  or (member_opens_at is not null and member_opens_at <= now() and is_active_member())
  or is_admin()
);

create policy "admins write domains"   on domains            for all using (is_admin()) with check (is_admin());
create policy "admins write tenures"   on tenures            for all using (is_admin()) with check (is_admin());
create policy "admins write team"      on team_members       for all using (is_admin()) with check (is_admin());
create policy "admins write events"    on events             for all using (is_admin()) with check (is_admin());
create policy "admins write folders"   on gallery_folders    for all using (is_admin()) with check (is_admin());
create policy "admins write photos"    on gallery_photos     for all using (is_admin()) with check (is_admin());
create policy "admins write posts"     on announcements      for all using (is_admin()) with check (is_admin());
create policy "admins write settings"  on membership_settings for all using (is_admin()) with check (is_admin());
create policy "admins write passes"    on event_passes       for all using (is_admin()) with check (is_admin());
create policy "admins write resources" on resources          for all using (is_admin()) with check (is_admin());
create policy "admins write quizzes"   on quizzes            for all using (is_admin()) with check (is_admin());
create policy "admins write questions" on quiz_questions     for all using (is_admin()) with check (is_admin());
create policy "admins write members"   on members            for all using (is_admin()) with check (is_admin());
create policy "admins write certs"     on certificates       for all using (is_admin()) with check (is_admin());
create policy "admins read allowlist"  on admin_allowlist    for select using (is_admin());
create policy "admins read feedback"   on feedback           for select using (is_admin());
create policy "admins read attempts"   on quiz_attempts      for select using (is_admin());

create policy "submit feedback" on feedback for insert with check (true);

create policy "own profile"    on profiles for select using (id = auth.uid() or is_admin());
create policy "own membership" on members  for select using (profile_id = auth.uid() or is_admin());
create policy "update own membership" on members for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "members read resources" on resources for select
  using (is_active_member() or is_admin());

create policy "own certificates" on certificates for select
  using (member_id in (select id from members where profile_id = auth.uid()) or is_admin());

create policy "members submit certificates" on certificates for insert
  with check (member_id in (select id from members where profile_id = auth.uid()));

create policy "members read live quizzes" on quizzes for select
  using ((is_live and is_active_member()) or is_admin());

create policy "members read questions" on quiz_questions for select
  using (is_active_member() or is_admin());

create policy "members write attempts" on quiz_attempts for insert
  with check (member_id in (select id from members where profile_id = auth.uid()));

create policy "own attempts" on quiz_attempts for select
  using (member_id in (select id from members where profile_id = auth.uid()) or is_admin());

-- =====================================================================
-- Storage buckets:
--   event-banners, gallery, member-photos  (public)
--   certificates                            (private)
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do update set public = false;

do $$
declare b text;
begin
  foreach b in array array['event-banners','gallery','member-photos'] loop
    begin
      execute format('create policy "read %1$s" on storage.objects for select using (bucket_id = %1$L)', b);
    exception when duplicate_object then null; end;
    begin
      execute format('create policy "admins upload %1$s" on storage.objects for insert to authenticated with check (bucket_id = %1$L and is_admin())', b);
    exception when duplicate_object then null; end;
    begin
      execute format('create policy "admins delete %1$s" on storage.objects for delete to authenticated using (bucket_id = %1$L and is_admin())', b);
    exception when duplicate_object then null; end;
  end loop;
end $$;

do $$
begin
  execute 'create policy "members upload certificates" on storage.objects for insert to authenticated with check (bucket_id = ''certificates'' and (storage.foldername(name))[1] = auth.uid()::text)';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'create policy "members read certificates" on storage.objects for select to authenticated using (bucket_id = ''certificates'' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()))';
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- Your first admin. Change the email if needed.
-- Then sign up on the site and run:
--   update profiles set role = 'admin' where email = 'jrehan2007@gmail.com';
-- =====================================================================

insert into admin_allowlist (email, note)
values ('jrehan2007@gmail.com', 'Chapter web lead')
on conflict (email) do nothing;
