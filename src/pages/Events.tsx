import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Building2, ArrowRight } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { IsteMark } from '../components/Logo'
import type { ChapterEvent, EventStatus } from '../lib/types'

const tabs: EventStatus[] = ['upcoming', 'ongoing', 'past']

type DummyEvent = ChapterEvent & { displayDate: string }

const dummyEvents: DummyEvent[] = [
  { id: 'bugthon', title: 'BUGTHON', displayDate: '21 SEPT 2026', description: 'A focused debugging sprint for fast, practical problem solving.', location: 'Easwari Engineering College', venue: 'GALLERY HALL', starts_at: '2026-09-21T09:00:00+05:30', status: 'upcoming', member_discount_pct: 10 },
  { id: 'codeverse', title: 'CODEVERSE', displayDate: '25 SEPT 2026', description: 'Build, test, and ship ideas across a full day of code.', location: 'Easwari Engineering College', venue: 'SEMINAR HALL', starts_at: '2026-09-25T09:00:00+05:30', status: 'upcoming', member_discount_pct: 15 },
  { id: 'technova', title: 'TECHNOVA', displayDate: '28 SEPT 2026', description: 'A technology showcase for ambitious student builders.', location: 'Easwari Engineering College', venue: 'AUDITORIUM', starts_at: '2026-09-28T09:00:00+05:30', status: 'upcoming', member_discount_pct: 20 },
  { id: 'ai-arena', title: 'AI ARENA', displayDate: '02 OCT 2026', description: 'Explore intelligent systems through a friendly competitive challenge.', location: 'Easwari Engineering College', venue: 'BLOCK A', starts_at: '2026-10-02T09:00:00+05:30', status: 'upcoming', member_discount_pct: 15 },
  { id: 'dummy-hack', title: 'DUMMY HACK', displayDate: '18 SEPT 2026', description: 'A temporary card for testing the event deck interaction.', location: 'Easwari Engineering College', venue: 'OAT', starts_at: '2026-09-18T09:00:00+05:30', status: 'upcoming', member_discount_pct: 10 },
]

export default function Events() {
  const [tab, setTab] = useState<EventStatus>('upcoming')
  const [stackOrder, setStackOrder] = useState<string[]>(dummyEvents.map((event) => event.id))
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setStackOrder(dummyEvents.map((event) => event.id))
    setFlippedIds({})
  }, [tab])

  const activeId = stackOrder[0] ?? null

  function bringToFront(id: string) {
    setStackOrder((previous) => [id, ...previous.filter((item) => item !== id)])
    setFlippedIds((previous) => ({ ...previous, [id]: false }))
    window.setTimeout(() => {
      setFlippedIds((previous) => ({ ...previous, [id]: true }))
    }, 650)
  }

  function handleCardClick(id: string) {
    if (!id) return
    if (id === activeId) {
      setFlippedIds((previous) => ({ ...previous, [id]: !previous[id] }))
      return
    }

    bringToFront(id)
  }

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

      {dummyEvents.length === 0 ? <EmptyState title={`Nothing ${tab} right now`} hint="Events published from the admin dashboard appear here." />
        : (
          <div className="event-deck-shell mt-8">
            <div className="event-deck-stack" role="list" aria-label="Event deck">
              {dummyEvents
                .slice()
                .sort((a, b) => stackOrder.indexOf(a.id) - stackOrder.indexOf(b.id))
                .map((event) => {
                  const isFront = event.id === activeId
                  const isFlipped = !!flippedIds[event.id]
                  const layerIndex = stackOrder.indexOf(event.id)
                  const offset = layerIndex * -18
                  const scale = 1 - layerIndex * 0.03
                  const opacity = 1 - layerIndex * 0.04

                  return (
                    <article
                      key={event.id}
                      role="listitem"
                      tabIndex={0}
                      aria-label={`Open ${event.title}`}
                      aria-pressed={isFront}
                      onClick={() => handleCardClick(event.id)}
                      onKeyDown={(clickEvent) => {
                        if (clickEvent.key === 'Enter' || clickEvent.key === ' ') {
                          clickEvent.preventDefault();
                          handleCardClick(event.id)
                        }
                      }}
                      className={`event-deck-card ${isFront ? 'is-front' : ''}`}
                      style={{
                        '--event-offset': `${offset}px`,
                        '--event-scale': `${scale}`,
                        '--event-opacity': `${opacity}`,
                        zIndex: 40 - layerIndex,
                      } as CSSProperties}
                    >
                      <div className={`event-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                        <div className="event-card-face event-card-front">
                          <div className="event-card-banner">
                            {event.banner_url
                              ? <img src={event.banner_url} alt="" className="event-card-image" />
                              : <IsteMark className="event-card-mark" />}
                          </div>
                          <div className="event-card-body">
                            <div className="event-card-topline">
                              <p className="event-card-kicker">ISTE EVENT</p>
                              <span className="event-card-discount">{event.member_discount_pct}% OFF</span>
                            </div>
                            <h2 className="event-card-title">{event.title}</h2>
                            <ul className="event-card-meta">
                              <li><MapPin size={15} className="text-turkish" />{event.location}</li>
                              <li><Building2 size={15} className="text-turkish" />{event.venue}</li>
                              <li><Clock size={15} className="text-turkish" />{event.displayDate}</li>
                            </ul>
                            {event.status === 'upcoming' && (
                              <div className="event-card-action-row">
                                <Link
                                  to={`/events/${event.id}/register`}
                                  onClick={(clickEvent) => clickEvent.stopPropagation()}
                                  className="btn-primary event-card-button"
                                >
                                  REGISTER NOW <ArrowRight size={16} />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="event-card-face event-card-back">
                          <div className="event-card-back-inner">
                            <div className="event-card-topline">
                              <p className="event-card-kicker">EVENT DETAILS</p>
                              <span className="event-card-discount">{event.member_discount_pct}% OFF</span>
                            </div>
                            <h3 className="event-card-back-title">{event.title}</h3>
                            <p className="event-card-back-copy">{event.description}</p>
                            <ul className="event-card-meta event-card-back-meta">
                              <li><Clock size={15} className="text-turkish" />{event.displayDate}</li>
                              <li><MapPin size={15} className="text-turkish" />{event.location}</li>
                              <li><Building2 size={15} className="text-turkish" />{event.venue}</li>
                            </ul>
                            <button
                              type="button"
                              className="btn-outline event-card-flip-button"
                              onClick={(clickEvent) => {
                                clickEvent.stopPropagation()
                                setFlippedIds((previous) => ({ ...previous, [event.id]: false }))
                              }}
                            >
                              View event
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
            </div>
          </div>
        )}
    </div>
  )
}
