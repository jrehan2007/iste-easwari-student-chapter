-- =====================================================================
-- DESTRUCTIVE. Wipes every chapter table so schema.sql can run cleanly.
-- Auth users are NOT deleted — remove those from Authentication > Users.
-- Only run this while setting up, never on a live site with real data.
-- =====================================================================

drop table if exists quiz_attempts      cascade;
drop table if exists quiz_questions     cascade;
drop table if exists quizzes            cascade;
drop table if exists certificates       cascade;
drop table if exists resources          cascade;
drop table if exists feedback           cascade;
drop table if exists announcements      cascade;
drop table if exists gallery_photos     cascade;
drop table if exists gallery_folders    cascade;
drop table if exists qr_checkins        cascade;
drop table if exists registrations      cascade;
drop table if exists event_passes       cascade;
drop table if exists events             cascade;
drop table if exists membership_settings cascade;
drop table if exists members            cascade;
drop table if exists team_members       cascade;
drop table if exists domains            cascade;
drop table if exists tenures            cascade;
drop table if exists admin_allowlist    cascade;
drop table if exists profiles           cascade;

drop function if exists is_admin()                     cascade;
drop function if exists is_active_member()             cascade;
drop function if exists handle_new_user()              cascade;
drop function if exists enforce_admin_allowlist()      cascade;
drop function if exists member_temp_login(text, text)  cascade;
drop function if exists member_claim_available(text, text) cascade;
drop function if exists member_claim_complete(text, uuid)  cascade;
drop function if exists scan_pass(text)                cascade;
drop function if exists set_current_tenure(uuid)       cascade;
drop function if exists verify_member(text)             cascade;

drop type if exists member_status cascade;
drop type if exists event_status  cascade;
drop type if exists user_role     cascade;

-- Storage policies from the previous run
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;
