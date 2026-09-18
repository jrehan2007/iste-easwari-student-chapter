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
security definer
set search_path = public
as $$
  select m.full_name, m.reg_no, m.department, m.section, m.year,
         m.photo_url, m.member_code, m.valid_from, m.valid_till
    from public.members m
   where m.member_code = p_member_code
     and m.status = 'active'
     and (m.valid_till is null or m.valid_till >= current_date);
$$;

grant execute on function public.verify_member(text) to anon, authenticated;