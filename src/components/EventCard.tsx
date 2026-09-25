import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Building2, ArrowRight } from 'lucide-react'
import { IsteMark } from './Logo'
import { eventEndsAt } from '../lib/eventStatus'
import { formatEventWhen } from '../lib/datetime'
import type { ChapterEvent } from '../lib/types'

/** What to say at the bottom of an ongoing card: before, during or just after the event. */
function ongoingNote(event: ChapterEvent, now: Date) {
  const end = eventEndsAt(event)
  if (now < new Date(event.starts_at)) return 'Today'
  if (end && now > end) return 'Just wrapped up'
  return 'Happening now'
}

/**
 * The event card used on the public Events page and in the member dashboard's
 * priority events.
 *
 * - `variant="member"` swaps the blue glow for the member dashboard's thin gold
 *   edge that only lights up on hover.
 * - `kicker`, `note` and `registerHref` let the member view say "Priority
 *   access", show when the public window opens, and use the event's own form.
 * - `buttonTabIndex` / `onButtonClick` let a carousel keep hidden cards out of
 *   the tab order and cancel a click that was really a drag.
 */
export default function EventCard({
  event, now = new Date(), variant = 'public', kicker, note, registerHref,
  buttonTabIndex, onButtonClick, role,
}: {
  event: ChapterEvent
  now?: Date
  variant?: 'public' | 'member'
  kicker?: string
  note?: ReactNode
  registerHref?: string
  buttonTabIndex?: number
  onButtonClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  role?: string
}) {
  const when = formatEventWhen(event.starts_at, event.ends_at)
  // Registration stays open until the event actually starts, including on the day.
  const canRegister = event.status === 'upcoming' || (event.status === 'ongoing' && now < new Date(event.starts_at))
  const venue = event.venue?.trim()
  const location = event.location?.trim()
  const discount = event.member_discount_pct ?? 0
  const href = registerHref ?? `/events/${event.id}/register`
  const external = /^https?:\/\//i.test(href)
  const buttonClass = variant === 'member' ? 'priority-register-button group event-card-button' : 'btn-primary event-card-button'
  const arrow = <ArrowRight size={16} aria-hidden className={variant === 'member' ? 'priority-register-arrow' : undefined} />

  return (
    <article role={role} className={`event-card ${variant === 'member' ? 'event-card-member' : ''}`}>
      <div className="event-card-banner">
        {event.banner_url
          ? <img src={event.banner_url} alt="" loading="lazy" draggable={false} className="event-card-image" />
          : <IsteMark className="event-card-mark" />}
      </div>

      <div className="event-card-body">
        <div className="event-card-topline">
          <p className="event-card-kicker">{kicker ?? `ISTE event · ${event.status}`}</p>
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
        {note && <p className="event-card-member-note">{note}</p>}

        <div className="event-card-action-row">
          {canRegister ? (
            external ? (
              <a href={href} target="_blank" rel="noreferrer" tabIndex={buttonTabIndex} onClick={onButtonClick} className={buttonClass}>
                Register now {arrow}
              </a>
            ) : (
              <Link to={href} tabIndex={buttonTabIndex} onClick={onButtonClick} className={buttonClass}>
                Register now {arrow}
              </Link>
            )
          ) : (
            <p className="event-card-note">{event.status === 'ongoing' ? ongoingNote(event, now) : 'This event has concluded'}</p>
          )}
        </div>
      </div>
    </article>
  )
}
