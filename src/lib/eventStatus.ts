import type { EventStatus } from './types'

type EventDates = { starts_at: string; ends_at?: string | null }

const DAY_MS = 24 * 60 * 60 * 1000

// Events run in Chennai, so "the day of the event" is the IST calendar day.
const istDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
})

/** Midnight IST at the start of the calendar day `date` falls on. */
function startOfIstDay(date: Date) {
  return new Date(`${istDay.format(date)}T00:00:00+05:30`)
}

/**
 * When the event is over: its end time if one was set, otherwise the end of
 * its (IST) start day, since without an end time the whole day is the event.
 */
export function eventEndsAt(event: EventDates): Date | null {
  const start = new Date(event.starts_at)
  if (Number.isNaN(start.getTime())) return null
  const end = event.ends_at ? new Date(event.ends_at) : null
  if (end && !Number.isNaN(end.getTime()) && end >= start) return end
  return new Date(startOfIstDay(start).getTime() + DAY_MS)
}

/**
 * Where an event belongs, worked out from its dates rather than set by hand:
 *   upcoming — before the day it starts (IST)
 *   ongoing  — from midnight on its start day until 24 hours after it ends
 *   past     — from then on
 */
export function eventPhase(event: EventDates, now = new Date()): EventStatus {
  const start = new Date(event.starts_at)
  const end = eventEndsAt(event)
  if (Number.isNaN(start.getTime()) || !end) return 'upcoming'
  if (now < startOfIstDay(start)) return 'upcoming'
  if (now.getTime() < end.getTime() + DAY_MS) return 'ongoing'
  return 'past'
}
