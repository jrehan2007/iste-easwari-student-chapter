import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Linkedin } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useAsync } from '../lib/useAsync'
import { listDomains, listTeam } from '../lib/api'
import type { Domain, TeamMember } from '../lib/types'

function Portrait({ person, size }: { person: TeamMember; size: string }) {
  const initials = person.name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  if (person.photo_url)
    return <img src={person.photo_url} alt={person.name} className={`${size} rounded-sm object-cover`} />
  return (
    <div className={`${size} flex items-center justify-center rounded-sm bg-turkish-mist font-display text-turkish-dark dark:bg-night dark:text-turkish-light`}>
      {initials}
    </div>
  )
}

/**
 * The leadership page. Domains run down the left as a rail; picking one shows
 * that domain's head first, then the rest of the team, each with photo, year
 * and a line on what they actually do.
 */
export default function Professional() {
  const domains = useAsync(() => listDomains(), [])
  const team = useAsync(() => listTeam(), [])
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!active && domains.data?.length) setActive(domains.data[0].id)
  }, [domains.data, active])

  const all = team.data ?? []
  const list = (domains.data ?? []) as Domain[]
  const current = list.find((d) => d.id === active)
  const people = all.filter((m) => m.domain_id === active)
  const head = people.find((m) => m.is_head)
  const rest = people.filter((m) => !m.is_head)

  if (domains.loading || team.loading)
    return <div className="container-page py-24 muted">Loading…</div>

  if (!list.length)
    return (
      <div className="container-page py-14">
        <h1 className="section-title">Professional</h1>
        <EmptyState title="No domains yet" hint="Create them in the admin Roles panel, then add people to each." />
      </div>
    )

  return (
    <div className="container-page py-14">
      <h1 className="section-title">Professional</h1>
      <p className="muted mt-3 max-w-2xl">
        The chapter runs on its domains. Pick one to meet the people behind it.
      </p>
      <div className="rule mt-5" />

      <div className="mt-8 grid gap-10 lg:grid-cols-[230px_1fr]">
        {/* Domain rail */}
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {list.map((d) => {
            const isActive = d.id === active
            const count = all.filter((m) => m.domain_id === d.id).length
            return (
              <button key={d.id} onClick={() => setActive(d.id)}
                className={`group relative shrink-0 border-l-2 px-4 py-3 text-left transition lg:w-full ${
                  isActive
                    ? 'border-turkish bg-turkish-mist dark:bg-night-soft'
                    : 'border-transparent hover:border-turkish/40 hover:bg-turkish-mist/50 dark:hover:bg-night-soft/60'
                }`}>
                <span className={`font-display block text-lg font-semibold ${
                  isActive ? 'text-turkish-dark dark:text-turkish-light' : ''}`}>
                  {d.name}
                </span>
                <span className="muted text-xs">{count} {count === 1 ? 'person' : 'people'}</span>
              </button>
            )
          })}
        </nav>

        {/* Domain detail */}
        <AnimatePresence mode="wait">
          <motion.section key={active ?? 'none'}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>

            {current?.tagline && (
              <p className="text-turkish-dark dark:text-turkish-light">{current.tagline}</p>
            )}
            <h2 className="font-display mt-1 text-3xl font-semibold">{current?.name}</h2>
            {current?.description && <p className="muted mt-2 max-w-2xl">{current.description}</p>}

            {!people.length ? (
              <EmptyState title="Nobody added to this domain yet" hint="Add them in the admin Roles panel." />
            ) : (
              <>
                {head && (
                  <article className="mt-8 grid gap-6 border-l-2 border-turkish bg-turkish-mist/40 p-6 sm:grid-cols-[150px_1fr] dark:bg-night-soft">
                    <Portrait person={head} size="h-[150px] w-[150px]" />
                    <div>
                      <p className="text-sm uppercase tracking-[0.14em] text-turkish-dark dark:text-turkish-light">
                        {head.role ?? `${current?.name} Head`}
                      </p>
                      <h3 className="font-display mt-1 text-2xl font-semibold">{head.name}</h3>
                      <p className="muted mt-0.5 text-sm">
                        {[head.year, head.department].filter(Boolean).join(' · ')}
                      </p>
                      {head.bio && <p className="mt-3 leading-relaxed">{head.bio}</p>}
                      {head.linkedin_url && (
                        <a href={head.linkedin_url} target="_blank" rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm text-turkish-dark hover:underline dark:text-turkish-light">
                          <Linkedin size={16} /> LinkedIn
                        </a>
                      )}
                    </div>
                  </article>
                )}

                {rest.length > 0 && (
                  <>
                    <h3 className="font-display mt-10 text-lg font-semibold tracking-wide">
                      The {current?.name} team
                    </h3>
                    <div className="rule mt-3" />
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {rest.map((m, i) => (
                        <motion.article key={m.id}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.04 }}
                          className="group flex gap-4 border-b border-turkish/15 pb-5 dark:border-night-line">
                          <Portrait person={m} size="h-20 w-20" />
                          <div className="min-w-0">
                            <h4 className="font-display text-lg font-semibold leading-tight">{m.name}</h4>
                            {m.role && <p className="text-sm text-turkish-dark dark:text-turkish-light">{m.role}</p>}
                            <p className="muted text-xs">{[m.year, m.department].filter(Boolean).join(' · ')}</p>
                            {m.bio && <p className="muted mt-1.5 text-sm leading-relaxed">{m.bio}</p>}
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  )
}
