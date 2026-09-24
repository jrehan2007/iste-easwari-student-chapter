import { Instagram, ExternalLink } from 'lucide-react'
import { isInstagramLink } from '../lib/url'

/**
 * The "open the attached link" line under a Live Wire announcement.
 * `onDark` is for cards that stay dark in both themes (the glowing cards).
 */
export default function AnnouncementLink({ href, className = '', onDark = false }: {
  href?: string | null; className?: string; onDark?: boolean
}) {
  if (!href) return null
  const instagram = isInstagramLink(href)
  const tone = onDark ? 'text-turkish-light' : 'text-turkish-dark dark:text-turkish-light'
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className={`inline-flex items-center gap-2 text-sm font-medium hover:underline ${tone} ${className}`}>
      {instagram && <Instagram size={16} aria-hidden />}
      {instagram ? 'View on Instagram' : 'Open link'}
      <ExternalLink size={14} aria-hidden />
    </a>
  )
}
