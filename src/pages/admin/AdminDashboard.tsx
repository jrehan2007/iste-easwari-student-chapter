import { useState, useEffect, useRef } from 'react'
import {
  CalendarDays, Pin, Images, IdCard, QrCode, Users, BarChart3, BookOpen, Settings2, Award, Link2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../lib/useAsync'
import * as api from '../../lib/api'
import { Panel, Table, Row, Action, Danger, useSaver } from './panels'
import QrPanel from './QrPanel'
import { isInstagramLink, normalizeExternalLink } from '../../lib/url'
import type { Lane, MembershipSettings, Domain, Tenure, TeamMember } from '../../lib/types'
import DashboardVideoBackground from '../../components/DashboardVideoBackground'

type Tab = 'events' | 'passes' | 'membership' | 'settings' | 'roles'
         | 'pinboard' | 'gallery' | 'resources' | 'analytics' | 'certificates'

const sections: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'events',     label: 'Events',          icon: CalendarDays },
  { id: 'passes',     label: 'Passes & scanner', icon: QrCode },
  { id: 'membership', label: 'Members',         icon: IdCard },
  { id: 'certificates', label: 'Certificate Approvals', icon: Award },
  { id: 'settings',   label: 'Membership page',  icon: Settings2 },
  { id: 'roles',      label: 'Office Bearers',  icon: Users },
  { id: 'pinboard',   label: 'Live Wire',       icon: Pin },
  { id: 'gallery',    label: 'Gallery',         icon: Images },
  { id: 'resources',  label: 'Archive',         icon: BookOpen },
  { id: 'analytics',  label: 'Analytics',       icon: BarChart3 },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('events')
  const { email } = useAuth()

  return (
    <div className="admin-dashboard dark relative min-h-screen overflow-hidden bg-night text-slate-100">
      <DashboardVideoBackground />
      <div className="container-page relative z-10 py-10">
        <h1 className="section-title">Admin dashboard</h1>
        <p className="muted mt-2">Signed in as {email}</p>
        <div className="rule mt-5" />

        <div className="mt-6 grid gap-8 lg:grid-cols-[210px_1fr]">
          <nav className="dash flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {sections.map((s) => (
              <button key={s.id} onClick={() => setTab(s.id)}
                className={`dash-nav ${tab === s.id
                  ? 'bg-turkish text-white'
                  : 'text-ink/75 hover:bg-turkish-mist dark:text-slate-300 dark:hover:bg-night-soft'}`}>
                <s.icon size={17} /> {s.label}
              </button>
            ))}
          </nav>

          <section>
            {tab === 'events'     && <EventsPanel />}
            {tab === 'passes'     && <QrPanel />}
            {tab === 'membership' && <MembersPanel />}
            {tab === 'certificates' && <CertificateApprovalsPanel />}
            {tab === 'settings'   && <MembershipSettingsPanel />}
            {tab === 'roles'      && <RolesPanel />}
            {tab === 'pinboard'   && <PinPanel />}
            {tab === 'gallery'    && <GalleryPanel />}
            {tab === 'resources'  && <ResourcesPanel />}
            {tab === 'analytics'  && <AnalyticsPanel />}
          </section>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Certificate approvals
function CertificateApprovalsPanel() {
  const pending = useAsync(() => api.listPendingCertificates(), [])
  const { run, banner } = useSaver()
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const certificates = (pending.data ?? []).filter((certificate) => !resolved.has(certificate.id))

  function resolve(id: string, status: 'approved' | 'rejected') {
    run(
      () => api.updateCertificateStatus(id, status),
      status === 'approved' ? 'Certificate approved.' : 'Certificate rejected.',
      () => setResolved((current) => new Set(current).add(id)),
    )
  }

  return (
    <Panel title="Certificate Approvals" hint="Review member-submitted certificates awaiting approval.">
      {banner}
      {pending.loading ? <p className="muted">Loading…</p> : pending.error ? (
        <p className="text-red-700 dark:text-red-300">{pending.error}</p>
      ) : !certificates.length ? (
        <p className="muted">No certificates pending review.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((certificate) => (
            <article key={certificate.id} className="card">
              <a href={certificate.file_url} target="_blank" rel="noreferrer"
                className="block overflow-hidden border border-turkish/20 dark:border-night-line">
                <img src={certificate.file_url} alt={`${certificate.event_title} certificate`}
                  className="h-52 w-full object-contain" />
              </a>
              <div className="mt-4 space-y-1 text-sm">
                <h3 className="font-display text-lg font-semibold">{certificate.members?.full_name ?? 'Unknown member'}</h3>
                <p>{certificate.event_title}</p>
                <p className="muted">{certificate.certificate_type}{certificate.rank ? ` · ${certificate.rank}` : ''}</p>
                <p className="muted">Issued {new Date(certificate.issued_on).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="mt-5 flex gap-3">
                <button className="btn-primary" onClick={() => resolve(certificate.id, 'approved')}>Approve</button>
                <button className="btn-outline" onClick={() => resolve(certificate.id, 'rejected')}>Reject</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ---------------------------------------------------------------- Events
function EventsPanel() {
  const { data, reload } = useAsync(() => api.listEvents(), [])
  const { run, banner } = useSaver()
  const blank = {
    title: '', description: '', location: '', venue: '', starts_at: '',
    status: 'upcoming' as const, google_form_url: '', member_discount_pct: 0,
    member_opens_at: '', public_opens_at: '',
  }
  const [form, setForm] = useState<Record<string, string | number>>(blank)
  const [banner_file, setBannerFile] = useState<File | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  // Default the public window to a week after members get access.
  function onMemberOpens(v: string) {
    const pub = v ? new Date(new Date(v).getTime() + 7 * 86400_000).toISOString().slice(0, 16) : ''
    setForm({ ...form, member_opens_at: v, public_opens_at: form.public_opens_at || pub })
  }

  return (
    <Panel title="Events" hint="Members see an event from their window; everyone else waits for the public one.">
      {banner}
      <div className="card grid gap-3 sm:grid-cols-2">
        <input className="field sm:col-span-2" placeholder="Event title" value={form.title as string} onChange={set('title')} />
        <textarea className="field sm:col-span-2" rows={3} placeholder="Description"
          value={form.description as string} onChange={set('description')} />
        <input className="field" placeholder="Location" value={form.location as string} onChange={set('location')} />
        <input className="field" placeholder="Venue" value={form.venue as string} onChange={set('venue')} />
        <div>
          <label className="label">Starts</label>
          <input className="field" type="datetime-local" value={form.starts_at as string} onChange={set('starts_at')} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="field" value={form.status as string} onChange={set('status')}>
            <option value="upcoming">upcoming</option><option value="ongoing">ongoing</option><option value="past">past</option>
          </select>
        </div>
        <div>
          <label className="label">Opens to members</label>
          <input className="field" type="datetime-local" value={form.member_opens_at as string}
            onChange={(e) => onMemberOpens(e.target.value)} />
        </div>
        <div>
          <label className="label">Opens to public</label>
          <input className="field" type="datetime-local" value={form.public_opens_at as string} onChange={set('public_opens_at')} />
        </div>
        <input className="field sm:col-span-2" placeholder="Google Form embed link"
          value={form.google_form_url as string} onChange={set('google_form_url')} />
        <div>
          <label className="label">Member discount %</label>
          <input className="field" type="number" value={form.member_discount_pct as number} onChange={set('member_discount_pct')} />
        </div>
        <div>
          <label className="label">Banner</label>
          <input className="field" type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} />
        </div>
        <button className="btn-primary sm:col-span-2" onClick={() => run(
          () => api.saveEvent({
            ...(form as object),
            starts_at: new Date(form.starts_at as string).toISOString(),
            member_opens_at: form.member_opens_at ? new Date(form.member_opens_at as string).toISOString() : null,
            public_opens_at: form.public_opens_at ? new Date(form.public_opens_at as string).toISOString() : null,
          } as never, banner_file),
          'Event published.', () => { setForm(blank); setBannerFile(null); reload() })}>
          Publish event
        </button>
      </div>

      {data?.length ? (
        <Table head={['Event', 'Status', 'Venue', 'Public from', '']}>
          {data.map((e) => (
            <Row key={e.id}>
              <td className="p-3">{e.title}</td>
              <td className="p-3 capitalize">{e.status}</td>
              <td className="p-3 muted">{e.venue}</td>
              <td className="p-3 muted">{e.public_opens_at ? new Date(e.public_opens_at).toLocaleDateString('en-IN') : 'Immediately'}</td>
              <td className="p-3 text-right">
                <Danger onClick={() => run(() => api.deleteEvent(e.id), 'Event deleted.', reload)}>Delete</Danger>
              </td>
            </Row>
          ))}
        </Table>
      ) : <p className="muted">No events yet.</p>}
    </Panel>
  )
}

// ---------------------------------------------------------------- Members
function MembersPanel() {
  const { data, reload } = useAsync(() => api.listMembers(), [])
  const { run, banner } = useSaver()
  const blank = { full_name: '', email: '', reg_no: '', department: '', section: '', year: '' }
  const [form, setForm] = useState(blank)
  const [temp, setTemp] = useState(api.generateTempPassword())
  const [photo, setPhoto] = useState<File | null>(null)
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <Panel title="Members"
      hint="Create the record and hand the student their temporary password. They set their own on first sign-in.">
      {banner}

      {issued && (
        <div className="card border-turkish bg-turkish-mist dark:bg-turkish/10">
          <p className="font-display font-semibold">Pass these to the student</p>
          <p className="mt-2 text-sm">Email: <code className="select-all">{issued.email}</code></p>
          <p className="text-sm">Temporary password: <code className="select-all text-lg">{issued.password}</code></p>
          <button className="btn-outline mt-3 py-1.5 text-sm"
            onClick={() => navigator.clipboard.writeText(`Email: ${issued.email}\nTemporary password: ${issued.password}`)}>
            Copy both
          </button>
        </div>
      )}

      <div className="card grid gap-3 sm:grid-cols-2">
        <input className="field" placeholder="Full name" value={form.full_name} onChange={set('full_name')} />
        <input className="field" type="email" placeholder="Email" value={form.email} onChange={set('email')} />
        <input className="field" placeholder="Register number" value={form.reg_no} onChange={set('reg_no')} />
        <input className="field" placeholder="Department" value={form.department} onChange={set('department')} />
        <input className="field" placeholder="Section" value={form.section} onChange={set('section')} />
        <input className="field" placeholder="Year" value={form.year} onChange={set('year')} />
        <div className="flex gap-2 sm:col-span-2">
          <input className="field" placeholder="Temporary password" value={temp} onChange={(e) => setTemp(e.target.value)} />
          <button className="btn-outline shrink-0" onClick={() => setTemp(api.generateTempPassword())}>Generate</button>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Member photo (used on their ID card)</label>
          <input className="field" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </div>
        <button className="btn-primary sm:col-span-2" onClick={() => run(
          () => api.createMember({ ...form, temp_password: temp }, photo),
          'Member created.',
          () => {
            setIssued({ email: form.email, password: temp })
            setForm(blank); setPhoto(null); setTemp(api.generateTempPassword()); reload()
          })}>
          Create member
        </button>
      </div>

      {data?.length ? (
        <Table head={['Name', 'Register no.', 'Status', 'Claimed', 'Valid till', '']}>
          {data.map((m) => (
            <Row key={m.id}>
              <td className="p-3">{m.full_name}</td>
              <td className="p-3 muted">{m.reg_no}</td>
              <td className="p-3 capitalize">{m.status}</td>
              <td className="p-3">{m.account_claimed ? 'Yes' : <span className="muted">Not yet</span>}</td>
              <td className="p-3 muted">{m.valid_till ?? '—'}</td>
              <td className="space-x-3 p-3 text-right">
                {m.status !== 'active' && (
                  <Action onClick={() => run(() => api.setMemberStatus(m.id, 'active'), 'Approved.', reload)}>Approve</Action>
                )}
                <Action onClick={() => run(async () => {
                  const p = await api.resetMemberPassword(m.id)
                  setIssued({ email: m.email, password: p })
                }, 'Password reset.', reload)}>Reset password</Action>
                <Danger onClick={() => run(() => api.deleteMember(m.id), 'Removed.', reload)}>Remove</Danger>
              </td>
            </Row>
          ))}
        </Table>
      ) : <p className="muted">No members yet.</p>}
    </Panel>
  )
}

// ---------------------------------------------------------------- Membership page settings
function MembershipSettingsPanel() {
  const { data, reload } = useAsync(() => api.getMembershipSettings(), [])
  const { run, banner } = useSaver()
  const [draft, setDraft] = useState<Partial<MembershipSettings> | null>(null)
  const s = draft ?? data ?? null
  const edit = (patch: Partial<MembershipSettings>) => setDraft({ ...(s ?? {}), ...patch })

  if (!s) return <Panel title="Membership page"><p className="muted">Loading…</p></Panel>

  return (
    <Panel title="Membership page"
      hint="Everything here is what visitors see on the public Membership page.">
      {banner}
      <div className="card grid gap-3">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={s.is_open ?? false}
            onChange={(e) => edit({ is_open: e.target.checked })} className="h-4 w-4 accent-[#00A9CE]" />
          <span>Registration is open</span>
        </label>
        <p className="muted -mt-1 text-sm">
          When this is off, visitors see the closed message instead of the form link.
        </p>

        <div>
          <label className="label">Headline</label>
          <input className="field" value={s.headline ?? ''} onChange={(e) => edit({ headline: e.target.value })} />
        </div>
        <div>
          <label className="label">Intro paragraph</label>
          <textarea className="field" rows={3} value={s.intro ?? ''} onChange={(e) => edit({ intro: e.target.value })} />
        </div>
        <div>
          <label className="label">Message shown while closed</label>
          <textarea className="field" rows={2} value={s.closed_message ?? ''}
            onChange={(e) => edit({ closed_message: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Price label</label>
            <input className="field" value={s.price_label ?? ''} onChange={(e) => edit({ price_label: e.target.value })} />
          </div>
          <div>
            <label className="label">Price note</label>
            <input className="field" value={s.price_note ?? ''} onChange={(e) => edit({ price_note: e.target.value })} />
          </div>
          <div>
            <label className="label">Opens on</label>
            <input className="field" type="date" value={s.opens_on ?? ''} onChange={(e) => edit({ opens_on: e.target.value })} />
          </div>
          <div>
            <label className="label">Closes on</label>
            <input className="field" type="date" value={s.closes_on ?? ''} onChange={(e) => edit({ closes_on: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Google Form link for applications</label>
          <input className="field" value={s.google_form_url ?? ''} onChange={(e) => edit({ google_form_url: e.target.value })} />
        </div>
        <div>
          <label className="label">Perks — one per line</label>
          <textarea className="field" rows={7} value={(s.perks ?? []).join('\n')}
            onChange={(e) => edit({ perks: e.target.value.split('\n') })} />
        </div>

        <button className="btn-primary w-fit" onClick={() => run(
          () => api.saveMembershipSettings({ ...s, perks: (s.perks ?? []).filter(Boolean) }),
          'Membership page updated.', () => { setDraft(null); reload() })}>
          Save changes
        </button>
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------- Office Bearers / Roles
function getPrimaryLeaderRank(m: TeamMember, domainName: string = '') {
  const r = `${m.role || ''} ${domainName}`.toLowerCase()
  if (r.includes('vice') || r.includes('joint')) return null
  if (r.includes('president')) return 1
  if (r.includes('secretary')) return 2
  if (r.includes('treasurer')) return 3
  return null
}

function getSecondaryLeaderRank(m: TeamMember, domainName: string = '') {
  const r = `${m.role || ''} ${domainName}`.toLowerCase()
  if (
    r.includes('vice president') ||
    r.includes('vice-president') ||
    (r.includes('vice') && r.includes('president')) ||
    r.includes('vp')
  )
    return 1
  if (
    r.includes('joint secretary') ||
    r.includes('joint-secretary') ||
    (r.includes('joint') && r.includes('secretary'))
  )
    return 2
  if (
    r.includes('joint treasurer') ||
    r.includes('joint-treasurer') ||
    (r.includes('joint') && r.includes('treasurer'))
  )
    return 3
  return null
}

function isLeadershipDomain(name: string = '') {
  const t = name.toLowerCase().trim()
  return (
    t.includes('president') ||
    t.includes('secretary') ||
    t.includes('treasurer') ||
    t.includes('executive council') ||
    t.includes('club leadership') ||
    t.includes('secondary leadership') ||
    t === 'leadership'
  )
}

function MemberAvatar({ person }: { person: Partial<TeamMember> }) {
  const initials = (person.name || 'MB')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
  if (person.photo_url)
    return <img src={person.photo_url} alt={person.name ?? ''} className="h-10 w-10 rounded-sm object-cover" />
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-turkish-mist font-display text-xs font-bold text-turkish-dark dark:bg-night-soft dark:text-turkish-light">
      {initials}
    </div>
  )
}

function RolesPanel() {
  const domains = useAsync(() => api.listDomains(), [])
  const team = useAsync(() => api.listTeam(), [])
  const tenures = useAsync(() => api.listTenures(), [])
  const { run, banner } = useSaver()

  // Tenure selection
  const [selectedTenureId, setSelectedTenureId] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'club_leadership' | 'secondary_leadership' | 'teams_domains'>('all')

  // Modals & form state
  const [bearerModalOpen, setBearerModalOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null)
  const [domainSectionOpen, setDomainSectionOpen] = useState(false)
  const [tenureSectionOpen, setTenureSectionOpen] = useState(false)

  const domainBlank = { id: '', name: '', tagline: '', description: '' }
  const [dom, setDom] = useState(domainBlank)
  const [domainToDelete, setDomainToDelete] = useState<{ id: string; name: string } | null>(null)

  const tenureBlank = { id: '', label: '', start_date: '', end_date: '', is_current: false }
  const [tenureForm, setTenureForm] = useState(tenureBlank)
  const [tenureToDelete, setTenureToDelete] = useState<Tenure | null>(null)

  interface BearerFormState {
    id: string
    name: string
    tenure_id: string
    category: 'club_leadership' | 'secondary_leadership' | 'team_domain'
    position: string
    domain_id: string
    role: string
    is_head: boolean
    year: string
    department: string
    bio: string
    linkedin_url: string
    photo_url: string
    sort_order: number
  }

  const blankBearerForm: BearerFormState = {
    id: '',
    name: '',
    tenure_id: '',
    category: 'club_leadership',
    position: 'President',
    domain_id: '',
    role: '',
    is_head: false,
    year: '',
    department: '',
    bio: '',
    linkedin_url: '',
    photo_url: '',
    sort_order: 0,
  }

  const [form, setForm] = useState<BearerFormState>(blankBearerForm)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const modalScrollRef = useRef<HTMLDivElement>(null)

  // Lock background scroll when any modal or confirmation dialog is active
  useEffect(() => {
    if (bearerModalOpen || memberToDelete || domainToDelete || tenureToDelete) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [bearerModalOpen, memberToDelete, domainToDelete, tenureToDelete])

  // Reset scroll to top when modal opens
  useEffect(() => {
    if (bearerModalOpen && modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0
    }
  }, [bearerModalOpen])

  // Initialize selected tenure
  const availableTenures = tenures.data ?? []
  const activeTenureId = selectedTenureId || (availableTenures.find((t) => t.is_current)?.id ?? availableTenures[0]?.id ?? '')
  const currentTenureObj = availableTenures.find((t) => t.id === activeTenureId)

  const allMembers = (team.data ?? []).filter((m) => m.tenure_id === activeTenureId)
  const allDomains = (domains.data ?? []) as Domain[]
  const functionalDomains = allDomains.filter((d) => !isLeadershipDomain(d.name))

  // Categorize members for active tenure
  const primaryLeaders = allMembers
    .map((m) => {
      const domName = allDomains.find((d) => d.id === m.domain_id)?.name || ''
      const rank = getPrimaryLeaderRank(m, domName)
      return { member: m, rank }
    })
    .filter((item): item is { member: TeamMember; rank: number } => item.rank !== null)
    .sort((a, b) => a.rank - b.rank || (a.member.sort_order ?? 0) - (b.member.sort_order ?? 0))
    .map((item) => item.member)

  const secondaryLeaders = allMembers
    .map((m) => {
      const domName = allDomains.find((d) => d.id === m.domain_id)?.name || ''
      const rank = getSecondaryLeaderRank(m, domName)
      return { member: m, rank }
    })
    .filter((item): item is { member: TeamMember; rank: number } => item.rank !== null)
    .sort((a, b) => a.rank - b.rank || (a.member.sort_order ?? 0) - (b.member.sort_order ?? 0))
    .map((item) => item.member)

  const allLeadershipMemberIds = new Set([
    ...primaryLeaders.map((m) => m.id),
    ...secondaryLeaders.map((m) => m.id),
  ])

  // Open modal for Adding
  const openAddModal = (presetCategory?: 'club_leadership' | 'secondary_leadership' | 'team_domain', presetDomainId?: string) => {
    const category = presetCategory ?? 'club_leadership'
    let position = 'President'
    if (category === 'secondary_leadership') position = 'Vice President'
    if (category === 'team_domain') position = ''

    setForm({
      ...blankBearerForm,
      tenure_id: activeTenureId,
      category,
      position,
      domain_id: presetDomainId || (functionalDomains[0]?.id ?? ''),
    })
    setPhoto(null)
    setPhotoPreview(null)
    setBearerModalOpen(true)
  }

  // Open modal for Editing
  const openEditModal = (m: TeamMember) => {
    const domName = allDomains.find((d) => d.id === m.domain_id)?.name || ''
    const pRank = getPrimaryLeaderRank(m, domName)
    const sRank = getSecondaryLeaderRank(m, domName)

    let category: 'club_leadership' | 'secondary_leadership' | 'team_domain' = 'team_domain'
    let position = ''

    if (pRank !== null) {
      category = 'club_leadership'
      position = pRank === 1 ? 'President' : pRank === 2 ? 'Secretary' : 'Treasurer'
    } else if (sRank !== null) {
      category = 'secondary_leadership'
      position = sRank === 1 ? 'Vice President' : sRank === 2 ? 'Joint Secretary' : 'Joint Treasurer'
    } else {
      category = 'team_domain'
      position = m.role || ''
    }

    setForm({
      id: m.id,
      name: m.name,
      tenure_id: m.tenure_id,
      category,
      position,
      domain_id: m.domain_id || (functionalDomains[0]?.id ?? ''),
      role: m.role || '',
      is_head: m.is_head,
      year: m.year || '',
      department: m.department || '',
      bio: m.bio || '',
      linkedin_url: m.linkedin_url || '',
      photo_url: m.photo_url || '',
      sort_order: m.sort_order ?? 0,
    })
    setPhoto(null)
    setPhotoPreview(m.photo_url || null)
    setBearerModalOpen(true)
  }

  // Save Office Bearer
  const handleSaveBearer = () => {
    let role = form.role
    let domain_id: string | null = form.domain_id
    let is_head = form.is_head

    if (form.category === 'club_leadership') {
      role = form.position
      domain_id = null
      is_head = false
    } else if (form.category === 'secondary_leadership') {
      role = form.position
      domain_id = null
      is_head = false
    } else {
      // Team / Domain
      role = form.role.trim() || (is_head ? `${allDomains.find((d) => d.id === form.domain_id)?.name ?? 'Domain'} Head` : 'Team Member')
      domain_id = form.domain_id || null
    }

    const payload: Partial<TeamMember> = {
      id: form.id || undefined,
      name: form.name.trim(),
      tenure_id: form.tenure_id,
      domain_id,
      role,
      is_head,
      year: form.year.trim() || undefined,
      department: form.department.trim() || undefined,
      bio: form.bio.trim() || undefined,
      linkedin_url: form.linkedin_url.trim() || undefined,
      sort_order: form.sort_order,
      photo_url: form.photo_url || undefined,
    }

    run(
      () => api.saveTeamMember(payload, photo),
      form.id ? 'Office bearer updated successfully.' : 'Office bearer added successfully.',
      () => {
        setBearerModalOpen(false)
        setForm(blankBearerForm)
        setPhoto(null)
        setPhotoPreview(null)
        team.reload()
      }
    )
  }

  return (
    <Panel
      title="Office Bearers"
      hint="Manage council leadership, secondary leadership, functional teams, and their members."
    >
      {banner}

      {/* Delete Confirmation Modal for Office Bearer */}
      {memberToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md space-y-4 border-turkish shadow-2xl">
            <h3 className="font-display text-lg font-bold text-slate-100">Delete Office Bearer?</h3>
            <p className="muted text-sm leading-relaxed">
              You are about to remove <span className="font-semibold text-slate-100">{memberToDelete.name}</span> ({memberToDelete.role || 'Member'}) from the{' '}
              <span className="font-semibold text-gold-deep dark:text-gold-light">
                {availableTenures.find((t) => t.id === memberToDelete.tenure_id)?.label ?? 'selected'}
              </span>{' '}
              tenure. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-outline text-sm" onClick={() => setMemberToDelete(null)}>
                Cancel
              </button>
              <button
                className="btn bg-red-700 text-sm text-white hover:bg-red-800"
                onClick={() =>
                  run(
                    () => api.deleteTeamMember(memberToDelete.id),
                    'Office bearer deleted successfully.',
                    () => {
                      setMemberToDelete(null)
                      team.reload()
                    }
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Domain */}
      {domainToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md space-y-4 border-turkish shadow-2xl">
            <h3 className="font-display text-lg font-bold text-slate-100">Delete Domain?</h3>
            <p className="muted text-sm">
              Are you sure you want to delete <span className="font-semibold text-slate-100">"{domainToDelete.name}"</span>? Members assigned to this domain will become unassigned.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-outline text-sm" onClick={() => setDomainToDelete(null)}>
                Cancel
              </button>
              <button
                className="btn bg-red-700 text-sm text-white hover:bg-red-800"
                onClick={() =>
                  run(
                    () => api.deleteDomain(domainToDelete.id),
                    'Domain deleted.',
                    () => {
                      setDomainToDelete(null)
                      domains.reload()
                      team.reload()
                    }
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Tenure */}
      {tenureToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md space-y-4 border-turkish shadow-2xl">
            <h3 className="font-display text-lg font-bold text-slate-100">Delete Tenure?</h3>
            <p className="muted text-sm">
              Are you sure you want to delete <span className="font-semibold text-slate-100">"{tenureToDelete.label}"</span>? All office bearers in this tenure will also be deleted.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-outline text-sm" onClick={() => setTenureToDelete(null)}>
                Cancel
              </button>
              <button
                className="btn bg-red-700 text-sm text-white hover:bg-red-800"
                onClick={() =>
                  run(
                    () => api.deleteTenure(tenureToDelete.id),
                    'Tenure deleted.',
                    () => {
                      setTenureToDelete(null)
                      tenures.reload()
                      team.reload()
                    }
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Office Bearer Modal */}
      {bearerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm overflow-hidden">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[calc(100dvh-3rem)] rounded-md border border-turkish/50 bg-[#0A1628] shadow-2xl overflow-hidden font-serif">
            {/* Fixed Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-turkish/20 bg-[#07101E]/95 px-5 py-3.5 dark:border-night-line">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-slate-100">
                  {form.id ? 'Edit Office Bearer' : 'Add New Office Bearer'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {form.id ? 'Update leadership role or functional domain membership' : 'Assign to leadership or functional domain for active tenure'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBearerModalOpen(false)}
                className="rounded-sm p-1.5 text-slate-400 hover:bg-night-soft hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <span className="text-lg leading-none font-bold">✕</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div ref={modalScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
              {/* 1. Personal Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-turkish-dark dark:text-turkish-light">
                  1. Personal Information
                </h4>
                <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">Full Name *</label>
                    <input
                      className="field"
                      placeholder="e.g. Dhayas sri"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="label">Year</label>
                    <input
                      className="field"
                      placeholder="e.g. III Year"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="label">Department</label>
                    <input
                      className="field"
                      placeholder="e.g. EEE / CSE / IT"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">LinkedIn URL</label>
                    <input
                      className="field"
                      placeholder="https://linkedin.com/in/..."
                      value={form.linkedin_url}
                      onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Bio / What they do</label>
                    <textarea
                      className="field"
                      rows={2}
                      placeholder="Brief description of their responsibilities in the chapter..."
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Profile Photo</label>
                    <div className="flex items-center gap-4">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="h-14 w-14 rounded-sm border border-turkish/30 object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-turkish-mist text-xs font-bold text-turkish-dark dark:bg-night-soft dark:text-turkish-light">
                          No Photo
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          className="field text-xs"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setPhoto(file)
                            if (file) {
                              setPhotoPreview(URL.createObjectURL(file))
                            }
                          }}
                        />
                        <span className="muted mt-1 block text-xs">Recommended: Square portrait image</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Organizational Placement & Hierarchy */}
              <div className="border-t border-turkish/15 pt-4 dark:border-night-line">
                <h4 className="text-xs font-bold uppercase tracking-wider text-turkish-dark dark:text-turkish-light">
                  2. Organizational Placement &amp; Hierarchy
                </h4>

                <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Tenure *</label>
                    <select
                      className="field"
                      value={form.tenure_id}
                      onChange={(e) => setForm({ ...form, tenure_id: e.target.value })}
                    >
                      {availableTenures.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label} {t.is_current ? ' · Current' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Hierarchy Category *</label>
                    <select
                      className="field font-medium text-gold-deep dark:text-gold-light"
                      value={form.category}
                      onChange={(e) => {
                        const cat = e.target.value as BearerFormState['category']
                        let pos = form.position
                        if (cat === 'club_leadership' && !['President', 'Secretary', 'Treasurer'].includes(pos)) {
                          pos = 'President'
                        } else if (cat === 'secondary_leadership' && !['Vice President', 'Joint Secretary', 'Joint Treasurer'].includes(pos)) {
                          pos = 'Vice President'
                        }
                        setForm({ ...form, category: cat, position: pos })
                      }}
                    >
                      <option value="club_leadership">Club Leadership (Primary Level)</option>
                      <option value="secondary_leadership">Secondary Leadership (Subordinate Level)</option>
                      <option value="team_domain">Functional Team / Domain</option>
                    </select>
                  </div>

                  {/* Dynamic fields based on category */}
                  {form.category === 'club_leadership' && (
                    <div className="sm:col-span-2 rounded-sm border border-gold/30 bg-gold/5 p-3 dark:bg-gold/10">
                      <label className="label text-gold-deep dark:text-gold-light">
                        Primary Leadership Position *
                      </label>
                      <select
                        className="field mt-1"
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                      >
                        <option value="President">President</option>
                        <option value="Secretary">Secretary</option>
                        <option value="Treasurer">Treasurer</option>
                      </select>
                      <p className="muted mt-1.5 text-xs">
                        This person will be placed in the primary centered leadership row on the public page.
                      </p>
                    </div>
                  )}

                  {form.category === 'secondary_leadership' && (
                    <div className="sm:col-span-2 rounded-sm border border-turkish/30 bg-turkish-mist/40 p-3 dark:bg-night-soft">
                      <label className="label text-turkish-dark dark:text-turkish-light">
                        Secondary Leadership Position *
                      </label>
                      <select
                        className="field mt-1"
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                      >
                        <option value="Vice President">Vice President</option>
                        <option value="Joint Secretary">Joint Secretary</option>
                        <option value="Joint Treasurer">Joint Treasurer</option>
                      </select>
                      <p className="muted mt-1.5 text-xs">
                        This person will be placed in the secondary centered leadership row directly beneath primary leadership.
                      </p>
                    </div>
                  )}

                  {form.category === 'team_domain' && (
                    <>
                      <div>
                        <label className="label">Functional Team / Domain *</label>
                        <select
                          className="field"
                          value={form.domain_id}
                          onChange={(e) => setForm({ ...form, domain_id: e.target.value })}
                        >
                          {functionalDomains.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label">Role Title in Team</label>
                        <input
                          className="field"
                          placeholder="e.g. Technical Head / Member"
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.is_head}
                            className="h-4 w-4 accent-[#00A9CE]"
                            onChange={(e) => setForm({ ...form, is_head: e.target.checked })}
                          />
                          <span>This person is the Domain Head / Lead</span>
                        </label>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="label">Display Order</label>
                    <input
                      className="field"
                      type="number"
                      placeholder="0"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky / Fixed Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-turkish/20 bg-[#07101E]/95 px-5 py-3.5 dark:border-night-line">
              <button
                type="button"
                className="btn-outline text-sm"
                onClick={() => setBearerModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={!form.name.trim() || !form.tenure_id || (form.category === 'team_domain' && !form.domain_id)}
                onClick={handleSaveBearer}
              >
                {form.id ? 'Save Changes' : 'Add Office Bearer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="card space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          {/* Tenure selection */}
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-semibold text-slate-200">Tenure:</span>
            <select
              className="field w-auto font-medium text-gold-deep dark:text-gold-light"
              value={activeTenureId}
              onChange={(e) => setSelectedTenureId(e.target.value)}
            >
              {availableTenures.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} {t.is_current ? ' · Current' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => openAddModal()}
              className="btn-primary text-xs font-semibold uppercase tracking-wider"
            >
              + Add Office Bearer
            </button>
            <button
              onClick={() => setDomainSectionOpen(!domainSectionOpen)}
              className="btn-outline text-xs"
            >
              {domainSectionOpen ? 'Hide Domains' : 'Manage Domains'}
            </button>
            <button
              onClick={() => setTenureSectionOpen(!tenureSectionOpen)}
              className="btn-outline text-xs"
            >
              {tenureSectionOpen ? 'Hide Tenures' : 'Manage Tenures'}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 border-t border-turkish/15 pt-3 dark:border-night-line">
          <span className="text-xs text-slate-400">Filter View:</span>
          {(
            [
              { id: 'all', label: 'All Positions' },
              { id: 'club_leadership', label: `Club Leadership (${primaryLeaders.length})` },
              { id: 'secondary_leadership', label: `Secondary Leadership (${secondaryLeaders.length})` },
              { id: 'teams_domains', label: `Teams & Domains (${functionalDomains.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`rounded-sm px-3 py-1 text-xs font-medium transition ${
                categoryFilter === tab.id
                  ? 'border border-turkish bg-turkish text-white'
                  : 'border border-turkish/20 text-slate-300 hover:bg-turkish-mist/40 dark:hover:bg-night-soft'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible: Manage Tenures */}
      {tenureSectionOpen && (
        <div className="card space-y-4 border-gold/30">
          <div>
            <h3 className="font-display text-lg font-semibold text-gold-deep dark:text-gold-light">Manage Tenures</h3>
            <p className="muted mt-1 text-sm">Create leadership periods before adding office bearers. Only one can be current.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <input
              className="field"
              placeholder="Label, e.g. 2026-27"
              value={tenureForm.label}
              onChange={(e) => setTenureForm({ ...tenureForm, label: e.target.value })}
            />
            <input
              className="field"
              type="date"
              value={tenureForm.start_date}
              onChange={(e) => setTenureForm({ ...tenureForm, start_date: e.target.value })}
            />
            <input
              className="field"
              type="date"
              value={tenureForm.end_date}
              onChange={(e) => setTenureForm({ ...tenureForm, end_date: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tenureForm.is_current}
                className="h-4 w-4 accent-[#C9A227]"
                onChange={(e) => setTenureForm({ ...tenureForm, is_current: e.target.checked })}
              />
              <span>Make current</span>
            </label>
            <div className="flex gap-2 sm:col-span-4">
              <button
                className="btn-primary"
                disabled={!tenureForm.label || !tenureForm.start_date || !tenureForm.end_date}
                onClick={() =>
                  run(
                    () => api.saveTenure(tenureForm),
                    tenureForm.id ? 'Tenure updated.' : 'Tenure created.',
                    () => {
                      setTenureForm(tenureBlank)
                      tenures.reload()
                      team.reload()
                    }
                  )
                }
              >
                {tenureForm.id ? 'Save tenure' : 'Create tenure'}
              </button>
              {tenureForm.id && (
                <button className="btn-outline" onClick={() => setTenureForm(tenureBlank)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
          {availableTenures.length ? (
            <Table head={['Tenure', 'Dates', 'Status', '']}>
              {availableTenures.map((tenure) => (
                <Row key={tenure.id}>
                  <td className="p-3 font-semibold">{tenure.label}</td>
                  <td className="p-3 muted">
                    {tenure.start_date} to {tenure.end_date}
                  </td>
                  <td className="p-3">
                    {tenure.is_current ? (
                      <span className="font-semibold text-gold-deep dark:text-gold-light">Current</span>
                    ) : (
                      <Action onClick={() => run(() => api.setCurrentTenure(tenure.id), 'Current tenure updated.', tenures.reload)}>
                        Set current
                      </Action>
                    )}
                  </td>
                  <td className="space-x-3 p-3 text-right">
                    <Action onClick={() => setTenureForm(tenure)}>Edit</Action>
                    <Danger onClick={() => setTenureToDelete(tenure)}>Delete</Danger>
                  </td>
                </Row>
              ))}
            </Table>
          ) : (
            <p className="muted text-sm">No tenures yet. Create one before adding office bearers.</p>
          )}
        </div>
      )}

      {/* Collapsible: Manage Functional Domains */}
      {domainSectionOpen && (
        <div className="card space-y-4 border-turkish/30">
          <div>
            <h3 className="font-display text-lg font-semibold text-turkish-dark dark:text-turkish-light">Manage Functional Domains</h3>
            <p className="muted mt-1 text-sm">Create functional teams (e.g. Content Head, Digital Head, Head of Operation) to group members.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className="field"
              placeholder="Domain name, e.g. Content Head"
              value={dom.name}
              onChange={(e) => setDom({ ...dom, name: e.target.value })}
            />
            <input
              className="field"
              placeholder="Tagline"
              value={dom.tagline}
              onChange={(e) => setDom({ ...dom, tagline: e.target.value })}
            />
            <input
              className="field"
              placeholder="Short description"
              value={dom.description}
              onChange={(e) => setDom({ ...dom, description: e.target.value })}
            />
            <div className="flex gap-2 sm:col-span-3">
              <button
                className="btn-primary"
                disabled={!dom.name.trim()}
                onClick={() =>
                  run(
                    () => api.saveDomain(dom),
                    dom.id ? 'Domain updated.' : 'Domain created.',
                    () => {
                      setDom(domainBlank)
                      domains.reload()
                      team.reload()
                    }
                  )
                }
              >
                {dom.id ? 'Save changes' : 'Create domain'}
              </button>
              {dom.id && (
                <button className="btn-outline" onClick={() => setDom(domainBlank)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
          {functionalDomains.length ? (
            <Table head={['Domain Name', 'Tagline', 'Members in current tenure', '']}>
              {functionalDomains.map((d) => {
                const count = allMembers.filter((m) => m.domain_id === d.id && !allLeadershipMemberIds.has(m.id)).length
                return (
                  <Row key={d.id}>
                    <td className="p-3 font-semibold text-slate-100">{d.name}</td>
                    <td className="p-3 muted">{d.tagline || '—'}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-turkish/10 px-2.5 py-0.5 text-xs font-semibold text-turkish-dark dark:text-turkish-light">
                        {count} {count === 1 ? 'member' : 'members'}
                      </span>
                    </td>
                    <td className="space-x-3 p-3 text-right">
                      <Action onClick={() => setDom({ id: d.id, name: d.name, tagline: d.tagline ?? '', description: d.description ?? '' })}>
                        Edit
                      </Action>
                      <Danger onClick={() => setDomainToDelete({ id: d.id, name: d.name })}>
                        Delete
                      </Danger>
                    </td>
                  </Row>
                )
              })}
            </Table>
          ) : (
            <p className="muted text-sm">No functional domains created yet.</p>
          )}
        </div>
      )}

      {/* ==================================================
          1. CLUB LEADERSHIP (PRIMARY LEVEL)
          ================================================== */}
      {(categoryFilter === 'all' || categoryFilter === 'club_leadership') && (
        <div className="card space-y-4 border-l-4 border-gold bg-white/70 shadow-sm dark:border-night-line dark:bg-night-soft">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-gold-deep dark:text-gold-light">
                Club Leadership (Primary Level)
              </div>
              <p className="muted mt-1 text-xs">
                President, Secretary, Treasurer governing the{' '}
                <span className="font-semibold text-gold-deep dark:text-gold-light">
                  {currentTenureObj?.label ?? 'selected'}
                </span>{' '}
                tenure.
              </p>
            </div>
            <button
              onClick={() => openAddModal('club_leadership')}
              className="btn-outline text-xs text-gold-deep hover:bg-gold/10 dark:text-gold-light"
            >
              + Add Primary Leader
            </button>
          </div>

          {primaryLeaders.length ? (
            <Table head={['Photo', 'Position', 'Name', 'Year · Department', 'LinkedIn', '']}>
              {primaryLeaders.map((m) => (
                <Row key={m.id}>
                  <td className="p-3">
                    <MemberAvatar person={m} />
                  </td>
                  <td className="p-3">
                    <span className="font-display font-bold uppercase tracking-wider text-gold-deep dark:text-gold-light">
                      {m.role || 'Executive Leader'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-100">{m.name}</td>
                  <td className="p-3 muted">{[m.year, m.department].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="p-3">
                    {m.linkedin_url ? (
                      <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-turkish hover:underline">
                        LinkedIn ↗
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="space-x-3 p-3 text-right">
                    <Action onClick={() => openEditModal(m)}>Edit</Action>
                    <Danger onClick={() => setMemberToDelete(m)}>Delete</Danger>
                  </td>
                </Row>
              ))}
            </Table>
          ) : (
            <div className="rounded-sm border border-dashed border-gold/30 p-6 text-center">
              <p className="muted text-sm">No primary leadership assigned for this tenure.</p>
              <button
                onClick={() => openAddModal('club_leadership')}
                className="btn-outline mt-3 text-xs"
              >
                + Assign President / Secretary / Treasurer
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          2. SECONDARY LEADERSHIP (SUBORDINATE LEVEL)
          ================================================== */}
      {(categoryFilter === 'all' || categoryFilter === 'secondary_leadership') && (
        <div className="card space-y-4 border-l-4 border-turkish bg-white/70 shadow-sm dark:border-night-line dark:bg-night-soft">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-turkish/40 bg-turkish/10 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-turkish-dark dark:text-turkish-light">
                Secondary Leadership (Subordinate Level)
              </div>
              <p className="muted mt-1 text-xs">
                Vice President, Joint Secretary, Joint Treasurer for the{' '}
                <span className="font-semibold text-gold-deep dark:text-gold-light">
                  {currentTenureObj?.label ?? 'selected'}
                </span>{' '}
                tenure.
              </p>
            </div>
            <button
              onClick={() => openAddModal('secondary_leadership')}
              className="btn-outline text-xs text-turkish-dark hover:bg-turkish-mist/40 dark:text-turkish-light"
            >
              + Add Secondary Leader
            </button>
          </div>

          {secondaryLeaders.length ? (
            <Table head={['Photo', 'Position', 'Name', 'Year · Department', 'LinkedIn', '']}>
              {secondaryLeaders.map((m) => (
                <Row key={m.id}>
                  <td className="p-3">
                    <MemberAvatar person={m} />
                  </td>
                  <td className="p-3">
                    <span className="font-display font-bold uppercase tracking-wider text-turkish-dark dark:text-turkish-light">
                      {m.role || 'Secondary Leader'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-100">{m.name}</td>
                  <td className="p-3 muted">{[m.year, m.department].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="p-3">
                    {m.linkedin_url ? (
                      <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-turkish hover:underline">
                        LinkedIn ↗
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="space-x-3 p-3 text-right">
                    <Action onClick={() => openEditModal(m)}>Edit</Action>
                    <Danger onClick={() => setMemberToDelete(m)}>Delete</Danger>
                  </td>
                </Row>
              ))}
            </Table>
          ) : (
            <div className="rounded-sm border border-dashed border-turkish/30 p-6 text-center">
              <p className="muted text-sm">No secondary leadership assigned for this tenure.</p>
              <button
                onClick={() => openAddModal('secondary_leadership')}
                className="btn-outline mt-3 text-xs"
              >
                + Assign Vice President / Joint Secretary / Joint Treasurer
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          3. TEAMS & DOMAINS (FUNCTIONAL DOMAINS)
          ================================================== */}
      {(categoryFilter === 'all' || categoryFilter === 'teams_domains') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-100">Functional Teams &amp; Domains</h3>
              <p className="muted text-xs">
                Manage members grouped under each functional team for the{' '}
                <span className="font-semibold text-gold-deep dark:text-gold-light">
                  {currentTenureObj?.label ?? 'selected'}
                </span>{' '}
                tenure.
              </p>
            </div>
            <button
              onClick={() => openAddModal('team_domain')}
              className="btn-outline text-xs"
            >
              + Add Team Member
            </button>
          </div>

          {!functionalDomains.length ? (
            <div className="card text-center p-8">
              <p className="muted text-sm">No functional teams created yet.</p>
              <button
                onClick={() => setDomainSectionOpen(true)}
                className="btn-primary mt-3 text-xs"
              >
                Create Functional Team
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {functionalDomains.map((d) => {
                const members = allMembers.filter((m) => m.domain_id === d.id && !allLeadershipMemberIds.has(m.id))

                return (
                  <div key={d.id} className="card space-y-3.5 border-turkish/20">
                    <div className="flex flex-col justify-between gap-2 border-b border-turkish/15 pb-3 sm:flex-row sm:items-center dark:border-night-line">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-base font-bold uppercase tracking-wider text-turkish-dark dark:text-turkish-light">
                            {d.name}
                          </h4>
                          <span className="rounded-full bg-turkish/10 px-2.5 py-0.5 text-xs font-semibold text-turkish-dark dark:text-turkish-light">
                            {members.length} {members.length === 1 ? 'Member' : 'Members'}
                          </span>
                        </div>
                        {d.tagline && <p className="muted mt-0.5 text-xs">{d.tagline}</p>}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openAddModal('team_domain', d.id)}
                          className="btn-outline text-xs"
                        >
                          + Add Member
                        </button>
                        <Action
                          onClick={() => {
                            setDom({ id: d.id, name: d.name, tagline: d.tagline ?? '', description: d.description ?? '' })
                            setDomainSectionOpen(true)
                          }}
                        >
                          Edit Team
                        </Action>
                      </div>
                    </div>

                    {members.length ? (
                      <Table head={['Photo', 'Name', 'Role / Position', 'Year · Department', 'Head', '']}>
                        {members.map((m) => (
                          <Row key={m.id}>
                            <td className="p-2.5">
                              <MemberAvatar person={m} />
                            </td>
                            <td className="p-2.5 font-semibold text-slate-100">{m.name}</td>
                            <td className="p-2.5 text-xs text-turkish-dark dark:text-turkish-light">
                              {m.role || 'Member'}
                            </td>
                            <td className="p-2.5 text-xs muted">{[m.year, m.department].filter(Boolean).join(' · ') || '—'}</td>
                            <td className="p-2.5 text-xs">
                              {m.is_head ? (
                                <span className="rounded bg-turkish/20 px-2 py-0.5 font-bold text-turkish-dark dark:text-turkish-light">
                                  Domain Head
                                </span>
                              ) : (
                                ''
                              )}
                            </td>
                            <td className="space-x-3 p-2.5 text-right text-xs">
                              <Action onClick={() => openEditModal(m)}>Edit</Action>
                              <Danger onClick={() => setMemberToDelete(m)}>Remove</Danger>
                            </td>
                          </Row>
                        ))}
                      </Table>
                    ) : (
                      <p className="muted py-2 text-xs">No members in this team for the selected tenure.</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}


// ---------------------------------------------------------------- Pin board
function PinPanel() {
  const { data, reload } = useAsync(() => api.listAnnouncements(), [])
  const { run, banner } = useSaver()
  const blank = { id: '', body: '', external_url: '', is_active: true, display_order: 0 }
  const [form, setForm] = useState(blank)
  // null = no link, undefined = not a usable web address
  const link = normalizeExternalLink(form.external_url)

  return (
    <Panel title="Live Wire" hint="Active messages scroll across the public homepage and member dashboard.">
      {banner}
      <div className="card grid gap-3">
        <textarea className="field sm:col-span-2" rows={3} placeholder="Announcement message" value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <div className="sm:col-span-2">
          <input className="field" type="url" inputMode="url" placeholder="Link (optional) — Instagram post, reel, form or website"
            value={form.external_url} aria-invalid={link === undefined}
            onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
          {link === undefined && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">Enter a web address, e.g. https://www.instagram.com/p/…</p>
          )}
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_active} className="h-4 w-4 accent-[#C9A227]"
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active on live tickers
        </label>
        <label className="flex items-center gap-2">
          <span>Order</span>
          <input className="field max-w-24" type="number" value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
        </label>
        <button className="btn-primary w-fit sm:col-span-2" disabled={!form.body.trim() || link === undefined}
          onClick={() => run(() => api.saveAnnouncement({
            ...form, title: form.body, external_url: link,
            source: isInstagramLink(link) ? 'instagram' : 'chapter',
          }),
            form.id ? 'Announcement updated.' : 'Announcement published.', () => { setForm(blank); reload() })}>
          {form.id ? 'Save announcement' : 'Publish announcement'}
        </button>
      </div>
      {data?.length ? (
        <ul className="space-y-2">
          {data.map((a) => (
            <li key={a.id} className="flex items-center justify-between border border-turkish/20 p-3 dark:border-night-line">
              <span className="min-w-0 flex-1 truncate">{a.body || a.title}</span>
              {a.external_url && (
                <a href={a.external_url} target="_blank" rel="noreferrer" title={a.external_url} aria-label="Open the attached link"
                  className="ml-3 shrink-0 text-turkish-dark hover:text-turkish dark:text-turkish-light">
                  <Link2 size={16} />
                </a>
              )}
              <span className="mx-3 text-sm muted">{a.is_active ? 'Active' : 'Inactive'} · #{a.display_order}</span>
              <div className="flex gap-3">
                <Action onClick={() => setForm({ id: a.id, body: a.body || a.title, external_url: a.external_url ?? '', is_active: a.is_active, display_order: a.display_order })}>Edit</Action>
                <Action onClick={() => run(() => api.saveAnnouncement({ id: a.id, is_active: !a.is_active }), 'Status updated.', reload)}>
                  {a.is_active ? 'Disable' : 'Enable'}
                </Action>
                <Danger onClick={() => run(() => api.deleteAnnouncement(a.id), 'Removed.', reload)}>Delete</Danger>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="muted">Nothing pinned yet.</p>}
    </Panel>
  )
}

// ---------------------------------------------------------------- Gallery
function GalleryPanel() {
  const { data, reload } = useAsync(() => api.listFolders(), [])
  const { run, banner } = useSaver()
  const [name, setName] = useState('')

  return (
    <Panel title="Gallery" hint="One folder per event, then upload photos into it.">
      {banner}
      <div className="card flex flex-wrap items-end gap-3">
        <input className="field max-w-xs" placeholder="Folder name, e.g. Hackathon 3.0"
          value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary" disabled={!name}
          onClick={() => run(() => api.createFolder(name), 'Folder created.', () => { setName(''); reload() })}>
          Create folder
        </button>
      </div>
      {data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((f) => (
            <div key={f.id} className="card">
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-semibold">{f.name}</h3>
                <Danger onClick={() => run(() => api.deleteFolder(f.id), 'Folder deleted.', reload)}>Delete</Danger>
              </div>
              <input className="field mt-3" type="file" multiple accept="image/*"
                onChange={(e) => e.target.files && run(() => api.uploadPhotos(f.id, e.target.files!), 'Photos uploaded.')} />
            </div>
          ))}
        </div>
      ) : <p className="muted">No albums yet.</p>}
    </Panel>
  )
}

// ---------------------------------------------------------------- Resources
function ResourcesPanel() {
  const { data, reload } = useAsync(() => api.listResources(), [])
  const { run, banner } = useSaver()
  const blank = { title: '', description: '', kind: 'newsletter', external_url: '' }
  const [form, setForm] = useState<Record<string, string>>(blank)
  const [file, setFile] = useState<File | null>(null)

  return (
    <Panel title="Members' archive" hint="Newsletters and workshop recordings. Only active members can read these.">
      {banner}
      <div className="card grid gap-3 sm:grid-cols-2">
        <input className="field" placeholder="Title" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className="field" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
          <option value="newsletter">Newsletter</option>
          <option value="recording">Recording</option>
          <option value="note">Note</option>
        </select>
        <textarea className="field sm:col-span-2" rows={2} placeholder="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="field" placeholder="External link (e.g. YouTube)" value={form.external_url}
          onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
        <input className="field" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="btn-primary sm:col-span-2" disabled={!form.title}
          onClick={() => run(() => api.createResource(form as never, file), 'Added to the archive.',
            () => { setForm(blank); setFile(null); reload() })}>
          Add resource
        </button>
      </div>
      {data?.length ? (
        <Table head={['Title', 'Kind', 'Published', '']}>
          {data.map((r) => (
            <Row key={r.id}>
              <td className="p-3">{r.title}</td>
              <td className="p-3 capitalize muted">{r.kind}</td>
              <td className="p-3 muted">{new Date(r.published_on).toLocaleDateString('en-IN')}</td>
              <td className="p-3 text-right">
                <Danger onClick={() => run(() => api.deleteResource(r.id), 'Removed.', reload)}>Remove</Danger>
              </td>
            </Row>
          ))}
        </Table>
      ) : <p className="muted">Archive is empty.</p>}
    </Panel>
  )
}

// ---------------------------------------------------------------- Analytics
function AnalyticsPanel() {
  const { data, loading } = useAsync(() => api.analytics(), [])
  if (loading || !data) return <Panel title="Analytics"><p className="muted">Loading…</p></Panel>

  const stats = [
    { label: 'Total members', value: data.totalMembers },
    { label: 'Active in last 30 days', value: data.activeMembers },
    { label: 'Inactive members', value: data.inactiveMembers },
  ]
  const peak = Math.max(1, ...data.growth.map((g) => g.count))

  return (
    <Panel title="Analytics" hint="Membership growth and event attendance based on recorded check-ins.">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="font-display text-3xl font-semibold text-turkish-dark dark:text-turkish-light">{s.value}</p>
            <p className="muted text-sm">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <p className="font-display font-semibold">Members joined by month</p>
        {data.growth.length ? (
          <div className="mt-4 flex h-40 items-end gap-3">
            {data.growth.map((g) => (
              <div key={g.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full bg-turkish" style={{ height: `${(g.count / peak) * 100}%` }} title={String(g.count)} />
                <span className="muted text-center text-xs">{g.month}</span>
              </div>
            ))}
          </div>
        ) : <p className="muted mt-3">No members yet.</p>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <p className="font-display font-semibold">Event participation</p>
          {data.eventParticipation.length ? (
            <Table head={['Event', 'Members checked in']}>
              {data.eventParticipation.map((event) => (
                <Row key={event.eventId}>
                  <td className="p-3">{event.eventTitle}</td>
                  <td className="p-3 text-right">{event.count}</td>
                </Row>
              ))}
            </Table>
          ) : <p className="muted mt-3">No events yet.</p>}
        </div>

        <div className="card">
          <p className="font-display font-semibold">Top 5 most active members</p>
          {data.leaderboard.length ? (
            <ol className="mt-3 divide-y divide-turkish/15 dark:divide-night-line">
              {data.leaderboard.map((member, index) => (
                <li key={member.memberId} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span><span className="muted mr-3">{index + 1}.</span>{member.memberName}</span>
                  <span className="font-semibold text-turkish-dark dark:text-turkish-light">
                    {member.count} {member.count === 1 ? 'check-in' : 'check-ins'}
                  </span>
                </li>
              ))}
            </ol>
          ) : <p className="muted mt-3">No member attendance recorded yet.</p>}
        </div>
      </div>
    </Panel>
  )
}
