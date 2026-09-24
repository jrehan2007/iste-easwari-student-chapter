import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Building2, ArrowRight } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { IsteMark } from '../components/Logo'
import { useAsync } from '../lib/useAsync'
import { listEvents } from '../lib/api'
import { eventEndsAt, eventPhase } from '../lib/eventStatus'
import type { ChapterEvent, EventStatus } from '../lib/types'

const tabs: EventStatus[] = ['upcoming', 'ongoing', 'past']

// Events happen in Chennai, so show their times in IST whatever the viewer's clock says.
const dateFormat = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
})
const timeFormat = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

function formatWhen(event: ChapterEvent) {
  const start = new Date(event.starts_at)
  if (Number.isNaN(start.getTime())) return ''
  const end = event.ends_at ? new Date(event.ends_at) : null
  const sameDay = end && dateFormat.format(end) === dateFormat.format(start)
  const endPart = !end || Number.isNaN(end.getTime()) ? ''
    : sameDay ? ` – ${timeFormat.format(end)}`
    : ` – ${dateFormat.format(end)}`
  return `${dateFormat.format(start)} · ${timeFormat.format(start)}${endPart}`
}

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
            {list.map((event) => <EventCard key={event.id} event={event} now={now} />)}
          </div>
        )}
    </div>
  )
}

/** What to say at the bottom of an ongoing card: before, during or just after the event. */
function ongoingNote(event: ChapterEvent, now: Date) {
  const end = eventEndsAt(event)
  if (now < new Date(event.starts_at)) return 'Today'
  if (end && now > end) return 'Just wrapped up'
  return 'Happening now'
}

function EventCard({ event, now }: { event: ChapterEvent; now: Date }) {
  const when = formatWhen(event)
  // Registration stays open until the event actually starts, including on the day.
  const canRegister = event.status === 'upcoming' || (event.status === 'ongoing' && now < new Date(event.starts_at))
  const venue = event.venue?.trim()
  const location = event.location?.trim()
  const discount = event.member_discount_pct ?? 0

  return (
    <article role="listitem" className="event-card">
      <div className="event-card-banner">
        {event.banner_url
          ? <img src={event.banner_url} alt="" loading="lazy" className="event-card-image" />
          : <IsteMark className="event-card-mark" />}
      </div>

      <div className="event-card-body">
        <div className="event-card-topline">
          <p className="event-card-kicker">ISTE event · {event.status}</p>
          {discount > 0 && <span className="event-card-discount">{discount}% off for members</span>}
        </div>

        <h2 className="event-card-title">{event.title}</h2>

        <ul className="event-card-meta">
          {when && <li><Clock size={15} aria-hidden />{when}</li>}
          {venue && <li><Building2 size={15} aria-hidden />{venue}</li>}
          {/* Skip the location when it only repeats the venue */}
          {location && location.toLowerCase() !== venue?.toLowerCase() && <li><MapPin size={15} aria-hidden />{location}</li>}
        </ul>

        {event.description && <p className="event-card-copy">{event.description}</p>}

        <div className="event-card-action-row">
          {canRegister ? (
            <Link to={`/events/${event.id}/register`} className="btn-primary event-card-button">
              Register now <ArrowRight size={16} aria-hidden />
            </Link>
          ) : (
            <p className="event-card-note">{event.status === 'ongoing' ? ongoingNote(event, now) : 'This event has concluded'}</p>
          )}
        </div>
      </div>
    </article>
  )
}
