// Chapter events happen in Chennai, so their dates and times are always shown
// in IST, whatever the clock of the phone or server that renders them says.
const TZ = 'Asia/Kolkata'

const dateFormat = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ })
const timeFormat = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ })

/** "Mon, 28 Sept 2026" */
export function formatEventDate(date: Date) {
  return dateFormat.format(date).replace(/,(?= \d{4}$)/, '')
}

/** "1:30 PM" */
export function formatEventTime(date: Date) {
  return timeFormat.format(date).replace(/\b(am|pm)\b/i, (m) => m.toUpperCase())
}

/**
 * "Mon, 28 Sept 2026 · 1:30 PM", with " – 3:45 PM" (same day) or
 * " – Tue, 29 Sept 2026" (later day) when an end time is known.
 */
export function formatEventWhen(startsAt: string, endsAt?: string | null) {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return ''
  const end = endsAt ? new Date(endsAt) : null
  const hasEnd = end && !Number.isNaN(end.getTime()) && end > start
  const endPart = !hasEnd ? ''
    : formatEventDate(end) === formatEventDate(start) ? ` – ${formatEventTime(end)}`
    : ` – ${formatEventDate(end)}`
  return `${formatEventDate(start)} · ${formatEventTime(start)}${endPart}`
}
