import { Instagram, ExternalLink } from 'lucide-react'
import { isInstagramLink } from '../lib/url'

/** The "open the attached link" line under a Live Wire announcement. */
export default function AnnouncementLink({ href, className = '' }: { href?: string | null; className?: string }) {
  if (!href) return null
  const instagram = isInstagramLink(href)
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className={`inline-flex items-center gap-2 text-sm font-medium text-turkish-dark hover:underline dark:text-turkish-light ${className}`}>
      {instagram && <Instagram size={16} aria-hidden />}
      {instagram ? 'View on Instagram' : 'Open link'}
      <ExternalLink size={14} aria-hidden />
    </a>
  )
}
