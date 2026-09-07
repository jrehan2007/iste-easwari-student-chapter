import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Building2 } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { IsteMark } from '../components/Logo'
import { useAsync } from '../lib/useAsync'
import { listEvents } from '../lib/api'
import type { EventStatus } from '../lib/types'

const tabs: EventStatus[] = ['upcoming', 'ongoing', 'past']

export default function Events() {
  const [tab, setTab] = useState<EventStatus>('upcoming')
  const { data, loading } = useAsync(() => listEvents(tab), [tab])

  return (
    <div className="container-page py-14">
      <h1 className="section-title">Events</h1>
      <div className="rule mt-5" />

      <div className="mt-6 flex gap-2" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-sm px-5 py-2 capitalize transition ${
              tab === t ? 'bg-turkish text-white'
                : 'border border-turkish/40 text-turkish-dark hover:bg-turkish-mist dark:text-turkish-light dark:hover:bg-turkish/10'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <p className="muted mt-8">Loading…</p>
        : !data?.length ? <EmptyState title={`Nothing ${tab} right now`} hint="Events published from the admin dashboard appear here." />
        : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {data.map((e) => (
              <article key={e.id} className="card overflow-hidden p-0">
                <div className="flex h-44 items-center justify-center bg-turkish-mist dark:bg-night">
                  {e.banner_url
                    ? <img src={e.banner_url} alt="" className="h-full w-full object-cover" />
                    : <IsteMark className="h-20 w-20 opacity-40" />}
                </div>
                <div className="p-5">
                  <h2 className="text-2xl">{e.title}</h2>
                  <p className="muted mt-2">{e.description}</p>
                  <ul className="muted mt-4 space-y-1.5 text-sm">
                    <li className="flex items-center gap-2"><MapPin size={16} className="text-turkish" />{e.location}</li>
                    <li className="flex items-center gap-2"><Building2 size={16} className="text-turkish" />{e.venue}</li>
                    <li className="flex items-center gap-2"><Clock size={16} className="text-turkish" />
                      {new Date(e.starts_at).toLocaleString('en-IN')}</li>
                  </ul>
                  {e.status === 'upcoming' && (
                    <Link to={`/events/${e.id}/register`} className="btn-primary mt-5">Register</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
    </div>
  )
}
