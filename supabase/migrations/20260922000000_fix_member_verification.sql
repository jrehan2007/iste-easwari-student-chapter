-- Member QR verification, made to work for every member's card.
--
-- The QR on an ID card points at /verify/<member_code>, which calls this
-- function anonymously. Matching is now case-insensitive and ignores stray
-- whitespace, so a code that was entered or stored untidily still verifies.
--
-- create or replace + the grants make this safe to re-run.

create or replace function public.verify_member(p_member_code text)
returns table (
  full_name text,
  reg_no text,
  department text,
  section text,
  year text,
  photo_url text,
  member_code text,
  valid_from date,
  valid_till date
)
language sql
stable
security definer
set search_path = public
as $$
  select m.full_name, m.reg_no, m.department, m.section, m.year,
         m.photo_url, m.member_code, m.valid_from, m.valid_till
    from public.members m
   where upper(btrim(m.member_code)) = upper(btrim(p_member_code))
     and m.status = 'active'
     and (m.valid_till is null or m.valid_till >= current_date)
   limit 1;
$$;

grant execute on function public.verify_member(text) to anon, authenticated;
