import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zlojmbjkebndetthzknv.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Key in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const memberRecord = {
  id: '00000000-0000-0000-0000-000000000310',
  full_name: 'REHAN',
  email: 'REHAN@GMAIL.COM',
  reg_no: '310',
  department: 'CSE',
  section: 'E',
  year: 'II',
  member_code: 'ISTE-EEC-2026-UDQQU',
  status: 'active',
  valid_from: '2026-06-30',
  valid_till: '2027-06-29',
  account_claimed: true,
  created_by_admin: true,
}

console.log('🌱 Seeding test member: [REHAN] (ISTE-EEC-2026-UDQQU)...')

async function runSeed() {
  const { data, error } = await supabase
    .from('members')
    .upsert(memberRecord, { onConflict: 'member_code' })
    .select()

  if (error) {
    if (error.code === '42501') {
      console.log('\n⚠️ Notice: Direct write via anon key is protected by Row Level Security (RLS).')
      console.log('To apply directly to your Supabase PostgreSQL database:')
      console.log('1. Open your Supabase Dashboard -> SQL Editor (or run supabase db reset).')
      console.log('2. Execute the idempotent SQL command from supabase/seed.sql:\n')
      console.log(`INSERT INTO members (
  id, full_name, email, reg_no, department, section, year,
  member_code, status, valid_from, valid_till, account_claimed, created_by_admin
)
VALUES (
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
ON CONFLICT (member_code) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  reg_no = EXCLUDED.reg_no,
  department = EXCLUDED.department,
  section = EXCLUDED.section,
  year = EXCLUDED.year,
  status = EXCLUDED.status,
  valid_from = EXCLUDED.valid_from,
  valid_till = EXCLUDED.valid_till,
  account_claimed = EXCLUDED.account_claimed,
  created_by_admin = EXCLUDED.created_by_admin;`)
      console.log('\n(Alternatively, set SUPABASE_SERVICE_ROLE_KEY in your .env to bypass RLS in Node)\n')
    } else {
      console.error('❌ Supabase error:', error)
      process.exit(1)
    }
  } else {
    console.log('✅ Member successfully seeded/upserted into database:', data)
  }
}

runSeed().catch((err) => {
  console.error('❌ Fatal error during seed:', err)
  process.exit(1)
})
