import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Linkedin } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useAsync } from '../lib/useAsync'
import { listDomains, listTeam, listTenures } from '../lib/api'
import type { Domain, TeamMember } from '../lib/types'

/**
 * An office bearer's photo. With a mouse it enlarges while the pointer is on
 * it; on a phone a tap enlarges it and a tap anywhere else (or Escape) puts it
 * back. `zoom` is how much it grows — smaller for the already-large head photos.
 */
function Portrait({ person, size, zoom = 1.9 }: { person: TeamMember; size: string; zoom?: number }) {
  const [zoomed, setZoomed] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const initials = person.name.split(' ').map((w) => w[0]).slice(0, 2).join('')

  useEffect(() => {
    if (!zoomed) return
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setZoomed(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomed(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [zoomed])

  if (person.photo_url)
    return (
      <button
        ref={ref}
        type="button"
        className={`portrait-zoom shrink-0 ${zoomed ? 'is-zoomed' : ''}`}
        style={{ '--portrait-zoom': zoom } as CSSProperties}
        aria-label={`${zoomed ? 'Shrink' : 'Enlarge'} photo of ${person.name}`}
        aria-pressed={zoomed}
        // Touch only: a mouse already enlarges it on hover
        onPointerUp={(e) => { if (e.pointerType !== 'mouse') setZoomed((z) => !z) }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setZoomed((z) => !z) } }}
      >
        <img src={person.photo_url} alt={person.name} loading="lazy" className={`${size} rounded-sm object-cover`} />
      </button>
    )
  return (
    <div className={`${size} flex items-center justify-center rounded-sm bg-turkish-mist font-display text-turkish-dark dark:bg-night dark:text-turkish-light`}>
      {initials}
    </div>
  )
}

/**
 * Identify primary leadership positions:
 * 1. President
 * 2. Secretary
 * 3. Treasurer
 */
function getPrimaryLeaderRank(m: TeamMember, domainName: string = '') {
  const r = `${m.role || ''} ${domainName}`.toLowerCase()
  if (r.includes('vice') || r.includes('joint')) return null
  if (r.includes('president')) return 1
  if (r.includes('secretary')) return 2
  if (r.includes('treasurer')) return 3
  return null
}

/**
 * Identify secondary leadership positions:
 * 1. Vice President
 * 2. Joint Secretary
 * 3. Joint Treasurer
 */
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

const isLeadershipDomain = (name: string = '') => {
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

/**
 * Organizational Hierarchy:
 * 1. Tenure Selector
 * 2. ISTE Executive Council (Centered Parent Header)
 * 3. Club Leadership — Primary Level (President, Secretary, Treasurer)
 * 4. Secondary Leadership — Secondary Level (Vice President, Joint Secretary, Joint Treasurer)
 * 5. Two-Column Functional Layout:
 *    - Left: Functional Teams & Domains Navigation
 *    - Right: Selected Team Members
 */
export default function Professional() {
  const domains = useAsync(() => listDomains(), [])
  const team = useAsync(() => listTeam(), [])
  const tenures = useAsync(() => listTenures(), [])
  const [active, setActive] = useState<string | null>(null)
  const [activeTenure, setActiveTenure] = useState<string | null>(null)

  const list = (domains.data ?? []) as Domain[]
  const availableTenures = tenures.data ?? []

  // Filter functional domains (exclude council-level leadership domains)
  const functionalDomains = list.filter((d) => !isLeadershipDomain(d.name))

  useEffect(() => {
    if (functionalDomains.length > 0) {
      const isCurrentValid = functionalDomains.some((d) => d.id === active)
      if (!isCurrentValid) {
        setActive(functionalDomains[0].id)
      }
    }
  }, [functionalDomains, active])

  useEffect(() => {
    if (!activeTenure && tenures.data?.length) {
      const current = tenures.data.find((tenure) => tenure.is_current) ?? tenures.data[0]
      setActiveTenure(current.id)
    }
  }, [tenures.data, activeTenure])

  const all = (team.data ?? []).filter((member) => member.tenure_id === activeTenure)
  const currentTenureObj = availableTenures.find((t) => t.id === activeTenure)

  // Primary Leadership (President, Secretary, Treasurer)
  const primaryLeaders = all
    .map((m) => {
      const dom = list.find((d) => d.id === m.domain_id)?.name || ''
      const rank = getPrimaryLeaderRank(m, dom)
      return { member: m, rank }
    })
    .filter((item): item is { member: TeamMember; rank: number } => item.rank !== null)
    .sort((a, b) => a.rank - b.rank || (a.member.sort_order ?? 0) - (b.member.sort_order ?? 0))
    .map((item) => item.member)

  // Secondary Leadership (Vice President, Joint Secretary, Joint Treasurer)
  const secondaryLeaders = all
    .map((m) => {
      const dom = list.find((d) => d.id === m.domain_id)?.name || ''
      const rank = getSecondaryLeaderRank(m, dom)
      return { member: m, rank }
    })
    .filter((item): item is { member: TeamMember; rank: number } => item.rank !== null)
    .sort((a, b) => a.rank - b.rank || (a.member.sort_order ?? 0) - (b.member.sort_order ?? 0))
    .map((item) => item.member)

  const allLeadershipMemberIds = new Set([
    ...primaryLeaders.map((m) => m.id),
    ...secondaryLeaders.map((m) => m.id),
  ])

  const current = functionalDomains.find((d) => d.id === active) || functionalDomains[0]
  const teamMembers = current
    ? all.filter((m) => m.domain_id === current.id && !allLeadershipMemberIds.has(m.id))
    : []
  const head = teamMembers.find((m) => m.is_head)
  const rest = head ? teamMembers.filter((m) => !m.is_head) : teamMembers

  const handleTenureChange = (newTenureId: string) => {
    setActiveTenure(newTenureId)
    if (functionalDomains.length > 0) {
      setActive(functionalDomains[0].id)
    }
  }

  if (domains.loading || team.loading || tenures.loading)
    return <div className="container-page py-24 muted">Loading…</div>

  if (!list.length)
    return (
      <div className="container-page py-8 sm:py-14">
        <h1 className="section-title">Office Bearers</h1>
        <EmptyState title="No domains yet" hint="Create them in the admin Roles panel, then add people to each." />
      </div>
    )

  if (!availableTenures.length)
    return (
      <div className="container-page py-8 sm:py-14">
        <h1 className="section-title">Office Bearers</h1>
        <EmptyState title="No tenures yet" hint="Office bearer records will appear here once an admin creates a tenure." />
      </div>
    )

  return (
    <div className="container-page py-8 sm:py-14">
      {/* Page Header */}
      <h1 className="section-title">Office Bearers</h1>
      <p className="muted mt-3 max-w-2xl">
        Meet the chapter leadership for each tenure. Select a tenure and domain to explore the team.
      </p>
      <div className="rule mt-5" />

      {/* 1. Tenure Section */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="font-display font-semibold text-ink dark:text-slate-200">Tenure</span>
        {availableTenures.map((tenure) => (
          <button
            key={tenure.id}
            onClick={() => handleTenureChange(tenure.id)}
            className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
              tenure.id === activeTenure
                ? 'border-gold bg-gold text-black shadow-sm'
                : 'border-gold/40 text-gold-deep hover:bg-gold/10 dark:text-gold-light'
            }`}
          >
            {tenure.label}{tenure.is_current ? ' · Current' : ''}
          </button>
        ))}
      </div>

      {/* 2. Centered Executive Council */}
      <div className="mt-8 sm:mt-10 flex flex-col items-center text-center">
        <div className="relative flex w-full max-w-2xl items-center justify-center">
          <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-turkish/40 sm:block" />
          <div className="mx-2 sm:mx-3 rounded-lg border border-gold/30 bg-white/70 px-4 py-3.5 sm:px-8 sm:py-5 shadow-sm dark:border-gold/25 dark:bg-night-soft">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-3xl dark:text-slate-100">
              ISTE Executive Council
            </h2>
            <p className="muted mt-1 text-xs sm:text-sm">
              Leadership &amp; functional domains governing the{' '}
              <span className="font-semibold text-gold-deep dark:text-gold-light">
                {currentTenureObj?.label ?? 'selected'}
              </span>{' '}
              tenure.
            </p>
          </div>
          <div className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-turkish/40 sm:block" />
        </div>

        {/* Vertical connector to Club Leadership */}
        <div className="my-2.5 sm:my-3 flex flex-col items-center">
          <div className="h-4 sm:h-5 w-px bg-gold/50" />
          <div className="h-1.5 w-1.5 rounded-full bg-gold" />
        </div>
      </div>

      {/* 3. Level 1: Primary Club Leadership (President, Secretary, Treasurer) */}
      {primaryLeaders.length > 0 && (
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 sm:mb-4 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 sm:px-4 py-1 text-xs font-bold uppercase tracking-widest text-gold-deep dark:text-gold-light">
            Club Leadership
          </div>

          <div className="flex w-full max-w-4xl flex-wrap items-center justify-center gap-3 sm:gap-5">
            {primaryLeaders.map((m) => (
              <article
                key={m.id}
                className="flex w-full max-w-sm sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] items-center gap-3 sm:gap-4 rounded-sm border-l-2 border-gold border-y border-r border-gold/30 bg-white/70 p-3 sm:p-4 text-left shadow-sm dark:border-y-night-line dark:border-r-night-line dark:bg-night-soft"
              >
                <Portrait person={m} size="h-16 w-16 sm:h-20 sm:w-20 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-gold-deep dark:text-gold-light">
                    {m.role || 'Executive Leader'}
                  </p>
                  <h4 className="font-display mt-0.5 text-sm sm:text-base font-bold text-ink dark:text-slate-100">
                    {m.name}
                  </h4>
                  <p className="muted text-xs">
                    {[m.year, m.department].filter(Boolean).join(' · ')}
                  </p>
                  {m.bio && <p className="muted mt-1 text-xs leading-relaxed line-clamp-2">{m.bio}</p>}
                  {m.linkedin_url && (
                    <a
                      href={m.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-turkish-dark hover:underline dark:text-turkish-light"
                    >
                      <Linkedin size={13} /> LinkedIn
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 4. Level 2: Secondary Leadership (Vice President, Joint Secretary, Joint Treasurer) */}
      {secondaryLeaders.length > 0 && (
        <div className="flex flex-col items-center text-center">
          {/* Subtle hierarchy connector from Primary to Secondary */}
          <div className="my-3 sm:my-4 flex flex-col items-center">
            <div className="h-4 sm:h-5 w-px bg-turkish/40" />
            <div className="h-1.5 w-1.5 rounded-full bg-turkish" />
          </div>

          <div className="mb-3 sm:mb-4 inline-flex items-center gap-1.5 rounded-full border border-turkish/40 bg-turkish/10 px-3 sm:px-4 py-1 text-xs font-bold uppercase tracking-widest text-turkish-dark dark:text-turkish-light">
            Secondary Leadership
          </div>

          <div className="flex w-full max-w-4xl flex-wrap items-center justify-center gap-3 sm:gap-5">
            {secondaryLeaders.map((m) => (
              <article
                key={m.id}
                className="flex w-full max-w-sm sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] items-center gap-3 sm:gap-4 rounded-sm border-l-2 border-turkish border-y border-r border-turkish/20 bg-turkish-mist/40 p-3 sm:p-4 text-left shadow-sm dark:border-y-night-line dark:border-r-night-line dark:bg-night-soft"
              >
                <Portrait person={m} size="h-16 w-16 sm:h-20 sm:w-20 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-turkish-dark dark:text-turkish-light">
                    {m.role || 'Secondary Leader'}
                  </p>
                  <h4 className="font-display mt-0.5 text-sm sm:text-base font-bold text-ink dark:text-slate-100">
                    {m.name}
                  </h4>
                  <p className="muted text-xs">
                    {[m.year, m.department].filter(Boolean).join(' · ')}
                  </p>
                  {m.bio && <p className="muted mt-1 text-xs leading-relaxed line-clamp-2">{m.bio}</p>}
                  {m.linkedin_url && (
                    <a
                      href={m.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-turkish-dark hover:underline dark:text-turkish-light"
                    >
                      <Linkedin size={13} /> LinkedIn
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Subtle connector to functional teams */}
      {(primaryLeaders.length > 0 || secondaryLeaders.length > 0) && (
        <div className="my-5 sm:my-6 flex flex-col items-center">
          <div className="h-5 sm:h-6 w-px bg-turkish/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-turkish/60" />
        </div>
      )}

      {/* 5. Two-Column Layout: Teams & Domains (Left) + Selected Team Members (Right) */}
      <div className="mt-2 grid gap-6 sm:gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
        {/* LEFT COLUMN: TEAMS & DOMAINS */}
        <aside>
          <div className="rounded-sm border border-turkish/20 bg-white/40 p-3 sm:p-3.5 shadow-sm dark:border-night-line dark:bg-night/70">
            <div className="mb-2.5 sm:mb-3 flex items-center justify-between border-b border-turkish/20 pb-2.5 dark:border-night-line">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-turkish-dark dark:text-turkish-light">
                Teams &amp; Domains
              </h3>
              <span className="text-xs font-medium text-ink/60 dark:text-slate-400">
                {functionalDomains.length} {functionalDomains.length === 1 ? 'Team' : 'Teams'}
              </span>
            </div>

            <nav className="flex max-h-[300px] lg:max-h-[620px] flex-col gap-1.5 overflow-y-auto pr-1">
              {functionalDomains.map((d) => {
                const isSelected = d.id === (current?.id ?? active)
                const count = all.filter((m) => m.domain_id === d.id && !allLeadershipMemberIds.has(m.id)).length

                return (
                  <button
                    key={d.id}
                    onClick={() => setActive(d.id)}
                    className={`group relative flex w-full items-center justify-between rounded-sm border px-3 py-2.5 sm:px-3.5 sm:py-3 text-left transition ${
                      isSelected
                        ? 'border-l-4 border-turkish border-y-turkish/20 border-r-turkish/20 bg-turkish-mist shadow-sm dark:border-y-night-line dark:border-r-night-line dark:bg-night-soft'
                        : 'border-transparent hover:border-turkish/30 hover:bg-turkish-mist/40 dark:hover:bg-night-soft/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span
                        className={`font-display block text-xs sm:text-sm font-semibold leading-snug tracking-wide uppercase transition ${
                          isSelected
                            ? 'font-bold text-turkish-dark dark:text-turkish-light'
                            : 'text-ink dark:text-slate-200 group-hover:text-turkish-dark dark:group-hover:text-turkish-light'
                        }`}
                      >
                        {d.name}
                      </span>
                      <span className="muted text-xs">
                        {count} {count === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 text-sm font-bold transition-transform ${
                        isSelected
                          ? 'translate-x-0.5 text-turkish'
                          : 'text-ink/30 dark:text-slate-600 group-hover:translate-x-0.5 group-hover:text-turkish'
                      }`}
                    >
                      →
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* RIGHT COLUMN: SELECTED TEAM MEMBERS */}
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTenure}-${current?.id ?? 'none'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {/* Selected Team Header */}
              <div className="flex flex-col justify-between gap-2 border-b-2 border-turkish/40 pb-4 sm:flex-row sm:items-end">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-tight text-ink dark:text-slate-100">
                    {current?.name}
                  </h3>
                  {current?.tagline && (
                    <p className="mt-1 text-xs sm:text-sm font-medium text-turkish-dark dark:text-turkish-light">
                      {current.tagline}
                    </p>
                  )}
                </div>

                <span className="inline-flex shrink-0 items-center self-start rounded-sm border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-gold-deep sm:self-auto dark:text-gold-light">
                  {teamMembers.length} {teamMembers.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              {current?.description && (
                <p className="muted mt-3 max-w-3xl text-xs sm:text-sm leading-relaxed">
                  {current.description}
                </p>
              )}

              {/* Members Display */}
              {!teamMembers.length ? (
                <div className="mt-6 sm:mt-8 rounded-sm border border-turkish/15 bg-white/50 p-6 sm:p-8 text-center dark:border-night-line dark:bg-night-soft/40">
                  <h4 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-ink dark:text-slate-100">
                    {current?.name}
                  </h4>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-turkish-dark dark:text-turkish-light">
                    0 Members
                  </p>
                  <p className="muted mt-3 text-xs sm:text-sm">
                    No members are currently assigned to this team.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {/* Domain Head (if present) */}
                  {head && (
                    <article className="grid gap-4 sm:gap-6 border-l-2 border-turkish bg-turkish-mist/40 p-4 sm:p-6 sm:grid-cols-[140px_1fr] dark:bg-night-soft">
                      <div className="flex justify-center sm:block">
                        <Portrait person={head} size="h-28 w-28 sm:h-[140px] sm:w-[140px] shrink-0" zoom={1.45} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm uppercase tracking-[0.14em] text-turkish-dark dark:text-turkish-light font-medium">
                          {head.role ?? `${current?.name} Head`}
                        </p>
                        <h4 className="font-display mt-1 text-xl sm:text-2xl font-semibold">{head.name}</h4>
                        <p className="muted mt-0.5 text-xs sm:text-sm">
                          {[head.year, head.department].filter(Boolean).join(' · ')}
                        </p>
                        {head.bio && <p className="mt-2.5 text-xs sm:text-sm leading-relaxed">{head.bio}</p>}
                        {head.linkedin_url && (
                          <a
                            href={head.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm text-turkish-dark hover:underline dark:text-turkish-light"
                          >
                            <Linkedin size={15} /> LinkedIn
                          </a>
                        )}
                      </div>
                    </article>
                  )}

                  {/* Rest of Team Members in Responsive Grid */}
                  {rest.length > 0 && (
                    <div>
                      {head && (
                        <div className="mb-4">
                          <h4 className="font-display text-base sm:text-lg font-semibold tracking-wide text-ink dark:text-slate-200">
                            The {current?.name} Team
                          </h4>
                          <div className="rule mt-2" />
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                        {rest.map((m) => (
                          <article
                            key={m.id}
                            className="group flex gap-3 sm:gap-4 rounded-sm border border-turkish/15 bg-white/40 p-3 sm:p-4 dark:border-night-line dark:bg-night-soft/50"
                          >
                            <Portrait person={m} size="h-16 w-16 sm:h-20 sm:w-20 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-display text-base sm:text-lg font-semibold leading-tight">{m.name}</h5>
                              {m.role && (
                                <p className="text-xs sm:text-sm text-turkish-dark dark:text-turkish-light">{m.role}</p>
                              )}
                              <p className="muted text-xs">
                                {[m.year, m.department].filter(Boolean).join(' · ')}
                              </p>
                              {m.bio && <p className="muted mt-1.5 text-xs sm:text-sm leading-relaxed line-clamp-2">{m.bio}</p>}
                              {m.linkedin_url && (
                                <a
                                  href={m.linkedin_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-turkish-dark hover:underline dark:text-turkish-light"
                                >
                                  <Linkedin size={13} /> LinkedIn
                                </a>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

