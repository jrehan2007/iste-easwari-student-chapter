-- =====================================================================
-- Migration: Secure QR-based ISTE Membership Verification
-- File: 20260921000001_secure_member_verification.sql
-- Description:
--   Creates a public security definer function `verify_member` that takes
--   a member code (or UUID id) and returns safe, non-sensitive verification
--   details (including status and validity dates) to allow verifying active,
--   expired, and inactive memberships without exposing emails or credentials.
-- =====================================================================

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

-- Allow anonymous visitors (phone camera scanners) and authenticated users to execute
grant execute on function public.verify_member(text) to anon, authenticated;
