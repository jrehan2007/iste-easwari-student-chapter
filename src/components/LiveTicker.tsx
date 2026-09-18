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

  const content = items.map((announcement) => (
    <span key={announcement.id} className="live-ticker-item">
      {announcement.body || announcement.title}
    </span>
  ))

  return (
    <div className={`live-ticker ${member ? 'live-ticker-member' : 'live-ticker-public'}`} aria-label="Live announcements">
      <div className="live-ticker-window">
        <div className="live-ticker-track">
          <div className="live-ticker-group">{content}</div>
          <div className="live-ticker-group" aria-hidden>{content}</div>
        </div>
      </div>
    </div>
  )
}
