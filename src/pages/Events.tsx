import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import EventCard from '../components/EventCard'
import { useAsync } from '../lib/useAsync'
import { listEvents } from '../lib/api'
import { eventPhase } from '../lib/eventStatus'
import type { EventStatus } from '../lib/types'

const tabs: EventStatus[] = ['upcoming', 'ongoing', 'past']

/**
 * The events page. Every card comes from the `events` table, so anything
 * published from the admin dashboard shows up here. Tabs follow the dates
 * (see eventPhase): upcoming until the event's day, ongoing on the day and
 * for 24 hours after it ends, then past.
 */
export default function Events() {
  const [tab, setTab] = useState<EventStatus>('upcoming')
  const events = useAsync(() => listEvents(), [])
  // Re-sort every minute so a page left open still moves cards across tabs on time.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(tick)
  }, [])

  const inTab = (events.data ?? [])
    .map((event) => ({ ...event, status: eventPhase(event, now) }))
    .filter((event) => event.status === tab)
  // Soonest first for what's coming; most recent first for what's done.
  const list = tab === 'past' ? inTab.reverse() : inTab

  return (
    <div className="container-page py-14">
      <h1 className="section-title">Events</h1>
      <div className="rule mt-5" />

      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-sm px-5 py-2 capitalize transition ${
              tab === t ? 'bg-turkish text-white'
                : 'border border-turkish/40 text-turkish-dark hover:bg-turkish-mist dark:text-turkish-light dark:hover:bg-turkish/10'}`}>
            {t}
          </button>
        ))}
      </div>

      {events.loading ? <p className="muted mt-10">Loading events…</p>
        : events.error ? <EmptyState title="Couldn't load events" hint="Please refresh the page in a moment." />
        : !list.length ? <EmptyState title={`Nothing ${tab} right now`} hint="Events published from the admin dashboard appear here." />
        : (
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {list.map((event) => <EventCard key={event.id} role="listitem" event={event} now={now} />)}
          </div>
        )}
    </div>
  )
}
