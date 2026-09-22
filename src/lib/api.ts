import { supabase, isSupabaseConfigured } from './supabase'
import type {
  Announcement, Certificate, ChapterEvent, Domain, EventPass, EventStatus,
  GalleryFolder, GalleryPhoto, Lane, MemberRecord, MembershipSettings, PendingCertificate,
  AnalyticsReport, MemberVerificationResult, Resource, ScanResult, TeamMember,
  Tenure, VerificationStatus, VerifiedMember,
} from './types'

/**
 * Every read and write goes through here. There is no demo data — if Supabase
 * isn't connected, reads return empty and pages show their empty state.
 */

function guard() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not connected. Add your keys to .env.')
}

const ok = <T,>(v: T) => (isSupabaseConfigured ? null : v)

function nullableUuid(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized || null
}

// ---------------------------------------------------------------- storage
export async function uploadFile(bucket: string, file: File) {
  guard()
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

// ---------------------------------------------------------------- tenures, domains & team
export async function listTenures() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('tenures').select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Tenure[]
}

export async function saveTenure(row: Partial<Tenure>) {
  guard()
  const id = nullableUuid(row.id)
  const { id: rawId, ...fields } = row
  const payload = row.is_current ? { ...fields, is_current: false } : fields
  const { data, error } = id
    ? await supabase.from('tenures').update(payload).eq('id', id).select().single()
    : await supabase.from('tenures').insert(payload).select().single()
  if (error) throw error
  if (row.is_current && data) await setCurrentTenure(data.id)
  return data as Tenure
}

export async function setCurrentTenure(id: string) {
  guard()
  const { error } = await supabase.rpc('set_current_tenure', { p_tenure_id: id })
  if (error) throw error
}

export async function deleteTenure(id: string) {
  guard()
  const { error } = await supabase.from('tenures').delete().eq('id', id)
  if (error) throw error
}

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
  const { id: rawId, domain_id, tenure_id, ...fields } = row
  const id = nullableUuid(rawId)
  const payload = {
    ...fields,
    domain_id: nullableUuid(domain_id),
    tenure_id: nullableUuid(tenure_id),
    photo_url,
  }
  const { error } = id
    ? await supabase.from('team_members').update(payload).eq('id', id)
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

export async function emailPasses(eventId: string): Promise<{ sent: number; failed: string[] }> {
  guard()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be signed in to email passes.')

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-passes`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_id: eventId }),
    },
  )
  const result = await response.json()
  if (!response.ok) throw new Error(result?.error ?? `Failed to email passes (${response.status})`)
  return result as { sent: number; failed: string[] }
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

/**
 * Manual fallback when a camera fails or a pass won't scan.
 *
 * One email can legitimately hold more than one pass for the same event, so the
 * query narrows to a single row before asking for one: the pass that hasn't been
 * used yet, newest first. With nothing matching, the caller gets a plain message
 * instead of a PostgREST "multiple (or no) rows returned" error.
 */
export async function checkInByEmail(eventId: string, email: string): Promise<ScanResult> {
  guard()
  const { data, error } = await supabase.from('event_passes').select('token')
    .eq('event_id', eventId)
    .ilike('leader_email', email.trim())
    .order('checked_in_at', { ascending: true, nullsFirst: true })
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`No pass found for this email (${email.trim()}).`)
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

export function generateVerificationId(seed?: string) {
  const year = new Date().getFullYear()
  const hash = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `VER-ISTE-${year}-${hash}`
}

export async function verifyMember(rawCodeOrId: string): Promise<MemberVerificationResult> {
  const verifiedAt = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const clean = (rawCodeOrId || '').trim()
  if (!clean) {
    return {
      status: 'not_found',
      verifiedAt,
      verificationId: generateVerificationId('UNKNOWN'),
    }
  }

  // Extract ID if a full URL was pasted/scanned (e.g. https://domain.com/verify/ISTE-EEC-2026-XXXX)
  const code = clean.includes('/verify/') ? clean.split('/verify/').pop()?.split(/[?#]/)[0] || clean : clean
  const verificationId = generateVerificationId(code)

  // 1. First call the dedicated Backend Verification API (GET /api/members/verify/:memberId)
  try {
    const apiRes = await fetch(`/api/members/verify/${encodeURIComponent(code)}`, {
      headers: { Accept: 'application/json' },
    })

    if (apiRes.ok) {
      const payload = await apiRes.json()
      if (payload.member) {
        return {
          status: payload.status as VerificationStatus,
          fullName: payload.member.name,
          email: payload.member.email,
          memberId: payload.member.memberId,
          membershipType: payload.member.membershipType || 'ISTE Student Chapter',
          institution: payload.member.institution || 'Easwari Engineering College, Ramapuram',
          department: payload.member.department,
          section: payload.member.section,
          year: payload.member.year,
          regNo: payload.member.regNo,
          photoUrl: payload.member.photoUrl || null,
          validFrom: payload.member.validFrom || null,
          validTill: payload.member.validUntil || null,
          verifiedAt: payload.verifiedAt || verifiedAt,
          verificationId: payload.verificationId || verificationId,
        }
      }
    } else if (apiRes.status === 404) {
      const payload = await apiRes.json().catch(() => ({}))
      return {
        status: 'not_found',
        verifiedAt: payload.verifiedAt || verifiedAt,
        verificationId: payload.verificationId || verificationId,
      }
    } else if (apiRes.status >= 500) {
      return {
        status: 'server_error',
        verifiedAt,
        verificationId,
        error: 'Verification service error',
      }
    }
  } catch {
    // Network or offline, fallback to Supabase query if available
  }

  if (!isSupabaseConfigured) {
    return {
      status: 'not_found',
      verifiedAt,
      verificationId,
      error: 'Database is not connected.',
    }
  }

  try {
    // 2. Direct query from members table (safely fetching only public verification fields)
    let query = supabase
      .from('members')
      .select('id, full_name, email, member_code, reg_no, department, section, year, photo_url, status, valid_from, valid_till')

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)
    if (isUuid) {
      query = query.or(`id.eq.${code},member_code.ilike.${code}`)
    } else {
      query = query.ilike('member_code', code)
    }

    const { data: member, error } = await query.maybeSingle()

    // 3. If direct query returned error (e.g. RLS blockage), try RPC verify_member as fallback
    let record = member as VerifiedMember | null
    if (error || !record) {
      const { data: rpcRows } = await supabase.rpc('verify_member', { p_member_code: code })
      if (rpcRows && rpcRows.length > 0) {
        record = rpcRows[0] as VerifiedMember
      }
    }

    if (!record) {
      return {
        status: 'not_found',
        verifiedAt,
        verificationId,
      }
    }

    // 4. Status and Expiration logic
    const nowStr = new Date().toISOString().slice(0, 10)
    const isExpired = Boolean((record.valid_till && record.valid_till < nowStr) || record.status === 'expired')
    const isInactive = record.status === 'rejected' || record.status === 'pending' || record.status === 'inactive'

    let status: VerificationStatus = 'active'
    if (isInactive) {
      status = 'inactive'
    } else if (isExpired) {
      status = 'expired'
    } else if (record.status === 'active') {
      status = 'active'
    } else {
      status = 'inactive'
    }

    return {
      status,
      fullName: record.full_name,
      email: record.email ?? undefined,
      memberId: record.member_code,
      membershipType: 'ISTE Student Chapter',
      institution: 'Easwari Engineering College, Ramapuram',
      department: record.department ?? undefined,
      section: record.section ?? undefined,
      year: record.year ?? undefined,
      regNo: record.reg_no ?? undefined,
      photoUrl: record.photo_url ?? null,
      validFrom: record.valid_from ?? null,
      validTill: record.valid_till ?? null,
      verifiedAt,
      verificationId,
    }
  } catch {
    return {
      status: 'network_error',
      verifiedAt,
      verificationId,
    }
  }
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

export async function listActiveAnnouncements() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('announcements').select('*')
    .eq('is_active', true).order('display_order').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Announcement[]
}

export async function createAnnouncement(row: Partial<Announcement>) {
  guard()
  const { error } = await supabase.from('announcements').insert(row)
  if (error) throw error
}

export async function saveAnnouncement(row: Partial<Announcement>) {
  guard()
  const payload = {
    title: row.title,
    body: row.body,
    image_url: row.image_url,
    source: row.source,
    external_url: row.external_url,
    display_order: row.display_order,
    is_active: row.is_active,
  }
  const { error } = row.id
    ? await supabase.from('announcements').update(payload).eq('id', row.id)
    : await supabase.from('announcements').insert(payload)
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
  const { data, error } = await supabase.from('certificates').select('*')
    .eq('member_id', memberId).order('issued_on', { ascending: false })
  if (error) throw error
  return (data ?? []) as Certificate[]
}

export async function uploadCertificate(file: File) {
  guard()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to upload a certificate.')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `${user.id}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from('certificates').upload(path, file)
  if (error) throw error
  const { data, error: signedUrlError } = await supabase.storage
    .from('certificates').createSignedUrl(path, 60 * 60 * 24 * 365)
  if (signedUrlError) throw signedUrlError
  return data.signedUrl
}

export async function submitCertificate(row: {
  member_id: string; event_id: string; event_title: string
  certificate_type: 'Merit' | 'Participation'
  rank?: '1st Prize' | '2nd Prize' | '3rd Prize' | 'Excellence' | null
  file_url: string; issued_on: string; status: 'pending'
}) {
  guard()
  const { error } = await supabase.from('certificates').insert(row)
  if (error) throw error
}

export async function listPendingCertificates() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('certificates')
    .select('*, members(full_name)').eq('status', 'pending').order('issued_on', { ascending: true })
  if (error) throw error
  return (data ?? []) as PendingCertificate[]
}

export async function updateCertificateStatus(id: string, status: 'approved' | 'rejected') {
  guard()
  const { error } = await supabase.from('certificates').update({ status }).eq('id', id)
  if (error) throw error
}

export async function issueCertificate(row: {
  member_id?: string | null; event_id: string; event_title: string
  recipient_name?: string; recipient_email?: string; file_url: string
}) {
  guard()
  const { error } = await supabase.from('certificates').insert(row)
  if (error) throw error
}

// ---------------------------------------------------------------- feedback
export async function submitFeedback(row: { name: string; email: string; message: string }) {
  guard()
  const { error } = await supabase.from('feedback').insert(row)
  if (error) throw error
}

// ---------------------------------------------------------------- analytics
export async function analytics() {
  const empty: AnalyticsReport = {
    totalMembers: 0, activeMembers: 0, inactiveMembers: 0, growth: [], eventParticipation: [], leaderboard: [],
  }
  if (!isSupabaseConfigured) return empty

  const [membersResult, eventsResult, passesResult] = await Promise.all([
    supabase.from('members').select('id, full_name, created_at'),
    supabase.from('events').select('id, title').order('starts_at', { ascending: false }),
    supabase.from('event_passes').select('member_id, event_id, checked_in_at').not('checked_in_at', 'is', null),
  ])
  if (membersResult.error) throw membersResult.error
  if (eventsResult.error) throw eventsResult.error
  if (passesResult.error) throw passesResult.error

  const members = membersResult.data ?? []
  const events = eventsResult.data ?? []
  const checkedIn = passesResult.data ?? []
  const memberNames = new Map(members.map((member) => [member.id, member.full_name]))
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const activeIds = new Set(
    checkedIn.filter((pass) => pass.member_id && new Date(pass.checked_in_at).getTime() >= cutoff)
      .map((pass) => pass.member_id as string),
  )

  const byMonth = new Map<string, number>()
  members.forEach((member) => {
    const date = new Date(member.created_at)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1)
  })

  const eventCounts = new Map<string, Set<string>>()
  const memberCounts = new Map<string, number>()
  checkedIn.forEach((pass) => {
    if (!pass.member_id) return
    const eventMembers = eventCounts.get(pass.event_id) ?? new Set<string>()
    eventMembers.add(pass.member_id)
    eventCounts.set(pass.event_id, eventMembers)
    memberCounts.set(pass.member_id, (memberCounts.get(pass.member_id) ?? 0) + 1)
  })

  return {
    totalMembers: members.length,
    activeMembers: activeIds.size,
    inactiveMembers: members.length - activeIds.size,
    growth: [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
    eventParticipation: events.map((event) => ({
      eventId: event.id, eventTitle: event.title, count: eventCounts.get(event.id)?.size ?? 0,
    })),
    leaderboard: [...memberCounts.entries()]
      .sort(([, a], [, b]) => b - a).slice(0, 5)
      .map(([memberId, count]) => ({ memberId, memberName: memberNames.get(memberId) ?? 'Unknown member', count })),
  } satisfies AnalyticsReport
}
