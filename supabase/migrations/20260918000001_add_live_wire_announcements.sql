create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text,
  body text,
  image_url text,
  source text default 'chapter',
  external_url text,
  created_at timestamp default now(),
  display_order integer not null default 0,
  is_active boolean not null default true
);

alter table public.announcements
  add column if not exists is_active boolean not null default true;

alter table public.announcements
  add column if not exists display_order integer not null default 0;

alter table public.announcements enable row level security;
