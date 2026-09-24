import { useEffect } from 'react'
import { useAsync } from '../lib/useAsync'
import { listActiveAnnouncements } from '../lib/api'

export default function LiveTicker({ member = false }: { member?: boolean }) {
  const announcements = useAsync(() => listActiveAnnouncements(), [])
  const items = announcements.data ?? []

  useEffect(() => {
    const refresh = window.setInterval(announcements.reload, 30000)
    return () => window.clearInterval(refresh)
  }, [announcements.reload])

  if (announcements.loading || !items.length) return null

  // Rendered twice for the seamless loop; the copy is aria-hidden, so its
  // links are kept out of the tab order too.
  const content = (copy: boolean) => items.map((announcement) => {
    const text = announcement.body || announcement.title
    return announcement.external_url ? (
      <a key={announcement.id} href={announcement.external_url} target="_blank" rel="noreferrer"
        tabIndex={copy ? -1 : undefined} className="live-ticker-item live-ticker-link">
        {text}
      </a>
    ) : (
      <span key={announcement.id} className="live-ticker-item">{text}</span>
    )
  })

  return (
    <div className={`live-ticker ${member ? 'live-ticker-member' : 'live-ticker-public'}`} aria-label="Live announcements">
      <div className="live-ticker-window">
        <div className="live-ticker-track">
          <div className="live-ticker-group">{content(false)}</div>
          <div className="live-ticker-group" aria-hidden>{content(true)}</div>
        </div>
      </div>
    </div>
  )
}
