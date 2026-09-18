create extension if not exists "uuid-ossp";

create table if not exists public.tenures (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamp default now()
);

create unique index if not exists one_current_tenure
  on public.tenures (is_current)
  where is_current = true;

alter table public.tenures enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tenures' and policyname = 'read tenures'
  ) then
    create policy "read tenures" on public.tenures for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tenures' and policyname = 'admins write tenures'
  ) then
    create policy "admins write tenures" on public.tenures
      for all using (is_admin()) with check (is_admin());
  end if;
end
$$;

alter table public.team_members
  add column if not exists tenure_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'team_members_tenure_id_fkey'
      and conrelid = 'public.team_members'::regclass
  ) then
    alter table public.team_members
      add constraint team_members_tenure_id_fkey
      foreign key (tenure_id) references public.tenures(id) on delete cascade;
  end if;
end
$$;

create or replace function public.set_current_tenure(p_tenure_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.tenures set is_current = false where is_current = true;
  update public.tenures set is_current = true where id = p_tenure_id;

  if not found then
    raise exception 'Tenure not found';
  end if;
end;
$$;

grant execute on function public.set_current_tenure(uuid) to authenticated;
