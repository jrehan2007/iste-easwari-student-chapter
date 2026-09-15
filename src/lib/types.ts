export type EventStatus = 'upcoming' | 'ongoing' | 'past'
export type MemberStatus = 'pending' | 'active' | 'expired' | 'rejected'
export type Lane = 'public' | 'membership'

export interface Domain {
  id: string
  name: string
  tagline?: string
  description?: string
  sort_order?: number
}

export interface TeamMember {
  id: string
  domain_id: string | null
  name: string
  role?: string | null
  is_head: boolean
  year?: string
  department?: string
  bio?: string
  photo_url?: string
  linkedin_url?: string
  sort_order?: number
}

export interface ChapterEvent {
  id: string
  title: string
  description: string
  banner_url?: string
  location: string
  venue: string
  starts_at: string
  ends_at?: string
  status: EventStatus
  google_form_url?: string
  member_discount_pct?: number
  member_opens_at?: string | null
  public_opens_at?: string | null
}

export interface EventPass {
  id: string
  event_id: string
  token: string
  leader_name?: string
  leader_email: string
  team_name?: string
  team_size?: number
  track?: string
  room?: string
  lane: Lane
  issued_at: string
  expires_at: string
  emailed_at?: string | null
  checked_in_at?: string | null
}

export interface ScanResult {
  result: 'valid' | 'already' | 'expired' | 'unknown' | 'forbidden'
  team_name?: string
  leader_name?: string
  leader_email?: string
  team_size?: number
  room?: string
  track?: string
  lane?: Lane
  event_title?: string
  checked_in_at?: string
  expires_at?: string
}

export interface MembershipSettings {
  id: number
  is_open: boolean
  headline: string
  intro?: string
  closed_message: string
  price_label: string
  price_note?: string
  google_form_url?: string
  perks: string[]
  opens_on?: string | null
  closes_on?: string | null
}

export interface MemberRecord {
  id: string
  profile_id?: string | null
  full_name: string
  email: string
  reg_no: string
  department?: string
  section?: string
  year?: string
  photo_url?: string
  member_code: string
  status: MemberStatus
  valid_from?: string
  valid_till?: string
  temp_password?: string | null
  account_claimed: boolean
}

export interface GalleryFolder { id: string; name: string; cover_url?: string }
export interface GalleryPhoto { id: string; folder_id: string; photo_url: string; caption?: string }

export interface Announcement {
  id: string
  title: string
  body: string
  image_url?: string
  source?: 'chapter' | 'instagram'
  external_url?: string
  created_at: string
}

export interface Resource {
  id: string
  title: string
  description?: string
  kind: 'newsletter' | 'recording' | 'note'
  file_url?: string
  external_url?: string
  published_on: string
}

export interface Certificate {
  id: string
  member_id: string
  event_id?: string | null
  event_title: string
  certificate_type: 'Merit' | 'Participation'
  rank?: '1st Prize' | '2nd Prize' | '3rd Prize' | 'Excellence' | null
  recipient_name?: string
  issued_on: string
  file_url: string
  status: 'pending' | string
}

export interface PendingCertificate extends Certificate {
  members: { full_name: string } | null
}

export interface AnalyticsReport {
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  growth: { month: string; count: number }[]
  eventParticipation: { eventId: string; eventTitle: string; count: number }[]
  leaderboard: { memberId: string; memberName: string; count: number }[]
}

export interface Quiz { id: string; title: string; topic?: string; is_live: boolean }
export interface QuizQuestion {
  id: string
  quiz_id: string
  prompt: string
  options: string[]
  correct_index: number
  explanation?: string
  sort_order?: number
}
export interface QuizAttempt {
  id: string; quiz_id: string; member_id: string
  score: number; total: number; attempted_at: string
}
