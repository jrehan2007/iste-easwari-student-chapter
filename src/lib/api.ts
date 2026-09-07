import { supabase, isSupabaseConfigured } from './supabase'
import type {
  Announcement, Certificate, ChapterEvent, Domain, EventPass, EventStatus,
  GalleryFolder, GalleryPhoto, Lane, MemberRecord, MembershipSettings,
  Quiz, QuizAttempt, QuizQuestion, Resource, ScanResult, TeamMember,
} from './types'

/**
 * Every read and write goes through here. There is no demo data — if Supabase
 * isn't connected, reads return empty and pages show their empty state.
 */

function guard() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not connected. Add your keys to .env.')
}

const ok = <T,>(v: T) => (isSupabaseConfigured ? null : v)

// ---------------------------------------------------------------- storage
export async function uploadFile(bucket: string, file: File) {
  guard()
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

// ---------------------------------------------------------------- domains & team
export async function listDomains() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('domains').select('*')
    .order('sort_order').order('name')
  if (error) throw error
  return (data ?? []) as Domain[]
}

export async function createDomain(row: Partial<Domain>) {
  guard()
  const { error } = await supabase.from('domains').insert(row)
  if (error) throw error
}

export async function deleteDomain(id: string) {
  guard()
  const { error } = await supabase.from('domains').delete().eq('id', id)
  if (error) throw error
}

export async function listTeam() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('team_members').select('*')
    .order('is_head', { ascending: false }).order('sort_order').order('name')
  if (error) throw error
  return (data ?? []) as TeamMember[]
}

export async function saveTeamMember(row: Partial<TeamMember>, photo?: File | null) {
  guard()
  const photo_url = photo ? await uploadFile('member-photos', photo) : row.photo_url
  const payload = { ...row, photo_url }
  const { error } = row.id
    ? await supabase.from('team_members').update(payload).eq('id', row.id)
    : await supabase.from('team_members').insert(payload)
  if (error) throw error
}

export async function deleteTeamMember(id: string) {
  guard()
  const { error } = await supabase.from('team_members').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------- events
export async function listEvents(status?: EventStatus) {
  if (!isSupabaseConfigured) return []
  let q = supabase.from('events').select('*').order('starts_at', { ascending: true })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as ChapterEvent[]
}

export async function getEvent(id: string) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
  if (error) throw error
  return data as ChapterEvent
}

export async function saveEvent(payload: Partial<ChapterEvent>, banner?: File | null) {
  guard()
  const banner_url = banner ? await uploadFile('event-banners', banner) : payload.banner_url
  const row = { ...payload, banner_url }
  const { error } = payload.id
    ? await supabase.from('events').update(row).eq('id', payload.id)
    : await supabase.from('events').insert(row)
  if (error) throw error
}

export async function deleteEvent(id: string) {
  guard()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------- passes
function makeToken() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function issuePasses(input: {
  event_id: string
  emails: string[]
  team_name?: string
  team_size?: number
  track?: string
  room?: string
  lane: Lane
  valid_days: number
}) {
  guard()
  const expires = new Date(Date.now() + input.valid_days * 86400_000).toISOString()
  const rows = input.emails.map((raw) => {
    // Accepts "Name <email>" or "email" or "email, Team Name"
    const email = (raw.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] ?? raw).trim()
    const leader_name = raw.replace(email, '').replace(/[<>,]/g, '').trim() || null
    return {
      event_id: input.event_id,
      token: makeToken(),
      leader_email: email,
      leader_name,
      team_name: input.team_name || leader_name || email,
      team_size: input.team_size ?? 1,
      track: input.track,
      room: input.room,
      lane: input.lane,
      expires_at: expires,
    }
  })
  const { data, error } = await supabase.from('event_passes').insert(rows).select()
  if (error) throw error
  return (data ?? []) as EventPass[]
}

export async function listPasses(eventId: string) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('event_passes').select('*')
    .eq('event_id', eventId).order('issued_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as EventPass[]
}

export async function deletePass(id: string) {
  guard()
  const { error } = await supabase.from('event_passes').delete().eq('id', id)
  if (error) throw error
}

export async function scanPass(token: string): Promise<ScanResult> {
  guard()
  const { data, error } = await supabase.rpc('scan_pass', { p_token: token })
  if (error) throw error
  return data as ScanResult
}

/** Manual fallback when a camera fails or a pass won't scan. */
export async function checkInByEmail(eventId: string, email: string): Promise<ScanResult> {
  guard()
  const { data, error } = await supabase.from('event_passes').select('token')
    .eq('event_id', eventId).ilike('leader_email', email.trim()).maybeSingle()
  if (error) throw error
  if (!data) return { result: 'unknown' }
  return scanPass(data.token)
}

// ---------------------------------------------------------------- membership settings
export async function getMembershipSettings() {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.from('membership_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return (data ?? null) as MembershipSettings | null
}

export async function saveMembershipSettings(patch: Partial<MembershipSettings>) {
  guard()
  const { error } = await supabase.from('membership_settings')
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1)
  if (error) throw error
}

// ---------------------------------------------------------------- members
export async function listMembers() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('members').select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MemberRecord[]
}

export function generateTempPassword() {
  return `iste-${Math.floor(1000 + Math.random() * 9000)}`
}

export function generateMemberCode() {
  return `ISTE-EEC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

/**
 * Creates the member record only. The student's login account is created by
 * themselves on first sign-in, using the temporary password stored here —
 * which is why no service-role key is needed anywhere in the browser.
 */
export async function createMember(row: {
  full_name: string; email: string; reg_no: string
  department?: string; section?: string; year?: string
  temp_password: string
}, photo?: File | null) {
  guard()
  const photo_url = photo ? await uploadFile('member-photos', photo) : undefined
  const now = new Date()
  const till = new Date(now.getFullYear() + (now.getMonth() >= 5 ? 1 : 0), 5, 30)
  const { error } = await supabase.from('members').insert({
    ...row,
    photo_url,
    member_code: generateMemberCode(),
    status: 'active',
    created_by_admin: true,
    account_claimed: false,
    must_change_password: true,
    valid_from: now.toISOString().slice(0, 10),
    valid_till: till.toISOString().slice(0, 10),
  })
  if (error) throw error
}

export async function setMemberStatus(id: string, status: MemberRecord['status']) {
  guard()
  const patch: Record<string, unknown> = { status }
  if (status === 'active') {
    const now = new Date()
    const till = new Date(now.getFullYear() + (now.getMonth() >= 5 ? 1 : 0), 5, 30)
    patch.valid_from = now.toISOString().slice(0, 10)
    patch.valid_till = till.toISOString().slice(0, 10)
  }
  const { error } = await supabase.from('members').update(patch).eq('id', id)
  if (error) throw error
}

export async function resetMemberPassword(id: string) {
  guard()
  const temp = generateTempPassword()
  const { error } = await supabase.from('members')
    .update({ temp_password: temp, account_claimed: false, must_change_password: true })
    .eq('id', id)
  if (error) throw error
  return temp
}

export async function deleteMember(id: string) {
  guard()
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw error
}

export async function myMembership(profileId: string) {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase.from('members').select('*').eq('profile_id', profileId).maybeSingle()
  return (data ?? null) as MemberRecord | null
}

export async function updateMyProfile(id: string, patch: Partial<MemberRecord>, photo?: File | null) {
  guard()
  const photo_url = photo ? await uploadFile('member-photos', photo) : patch.photo_url
  const { error } = await supabase.from('members').update({ ...patch, photo_url }).eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------- gallery
export async function listFolders() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('gallery_folders').select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as GalleryFolder[]
}

export async function listPhotos(folderId: string) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('gallery_photos').select('*').eq('folder_id', folderId)
  if (error) throw error
  return (data ?? []) as GalleryPhoto[]
}

export async function createFolder(name: string) {
  guard()
  const { error } = await supabase.from('gallery_folders').insert({ name })
  if (error) throw error
}

export async function deleteFolder(id: string) {
  guard()
  const { error } = await supabase.from('gallery_folders').delete().eq('id', id)
  if (error) throw error
}

export async function uploadPhotos(folderId: string, files: FileList) {
  guard()
  for (const file of Array.from(files)) {
    const photo_url = await uploadFile('gallery', file)
    const { error } = await supabase.from('gallery_photos')
      .insert({ folder_id: folderId, photo_url })
    if (error) throw error
  }
}

// ---------------------------------------------------------------- pin board
export async function listAnnouncements(limit?: number) {
  if (!isSupabaseConfigured) return []
  let q = supabase.from('announcements').select('*').order('created_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Announcement[]
}

export async function createAnnouncement(row: Partial<Announcement>) {
  guard()
  const { error } = await supabase.from('announcements').insert(row)
  if (error) throw error
}

export async function deleteAnnouncement(id: string) {
  guard()
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------- resources
export async function listResources() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('resources').select('*')
    .order('published_on', { ascending: false })
  if (error) throw error
  return (data ?? []) as Resource[]
}

export async function createResource(row: Partial<Resource>, file?: File | null) {
  guard()
  const file_url = file ? await uploadFile('gallery', file) : row.file_url
  const { error } = await supabase.from('resources').insert({ ...row, file_url })
  if (error) throw error
}

export async function deleteResource(id: string) {
  guard()
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------- certificates
export async function listCertificates(memberId: string) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('certificates').select('*').eq('member_id', memberId)
  if (error) throw error
  return (data ?? []) as Certificate[]
}

export async function issueCertificate(row: {
  member_id?: string | null; event_id: string; event_title: string
  recipient_name?: string; recipient_email?: string; file_url: string
}) {
  guard()
  const { error } = await supabase.from('certificates').insert(row)
  if (error) throw error
}

// ---------------------------------------------------------------- quizzes
export async function listQuizzes() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Quiz[]
}

export async function liveQuiz() {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase.from('quizzes').select('*').eq('is_live', true)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  return (data ?? null) as Quiz | null
}

export async function listQuestions(quizId: string) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('quiz_questions').select('*')
    .eq('quiz_id', quizId).order('sort_order')
  if (error) throw error
  return (data ?? []) as QuizQuestion[]
}

export async function createQuiz(row: Partial<Quiz>) {
  guard()
  const { data, error } = await supabase.from('quizzes').insert(row).select().single()
  if (error) throw error
  return data as Quiz
}

export async function setQuizLive(id: string, is_live: boolean) {
  guard()
  if (is_live) await supabase.from('quizzes').update({ is_live: false }).neq('id', id)
  const { error } = await supabase.from('quizzes').update({ is_live }).eq('id', id)
  if (error) throw error
}

export async function deleteQuiz(id: string) {
  guard()
  const { error } = await supabase.from('quizzes').delete().eq('id', id)
  if (error) throw error
}

export async function addQuestion(row: Partial<QuizQuestion>) {
  guard()
  const { error } = await supabase.from('quiz_questions').insert(row)
  if (error) throw error
}

export async function recordAttempt(row: { quiz_id: string; member_id: string; score: number; total: number }) {
  guard()
  const { error } = await supabase.from('quiz_attempts').insert(row)
  if (error) throw error
}

export async function myAttempts(memberId: string) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('quiz_attempts').select('*')
    .eq('member_id', memberId).order('attempted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as QuizAttempt[]
}

// ---------------------------------------------------------------- feedback
export async function submitFeedback(row: { name: string; email: string; message: string }) {
  guard()
  const { error } = await supabase.from('feedback').insert(row)
  if (error) throw error
}

// ---------------------------------------------------------------- analytics
export async function analytics() {
  if (!isSupabaseConfigured)
    return { members: 0, events: 0, passes: 0, checkins: 0, growth: [] as { month: string; count: number }[] }

  const [m, e, p, c] = await Promise.all([
    supabase.from('members').select('id, created_at').eq('status', 'active'),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('event_passes').select('id', { count: 'exact', head: true }),
    supabase.from('event_passes').select('id', { count: 'exact', head: true }).not('checked_in_at', 'is', null),
  ])

  const byMonth = new Map<string, number>()
  ;(m.data ?? []).forEach((row: { created_at: string }) => {
    const key = new Date(row.created_at).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1)
  })
  let running = 0
  const growth = [...byMonth.entries()].map(([month, n]) => ({ month, count: (running += n) }))

  return {
    members: m.data?.length ?? 0,
    events: e.count ?? 0,
    passes: p.count ?? 0,
    checkins: c.count ?? 0,
    growth,
  }
}
