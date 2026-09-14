import { Linkedin, Instagram, MapPin } from 'lucide-react'
import { EaswariMark, IsteMark } from './Logo'

export default function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-turkish bg-[#E8F1F4] text-ink dark:bg-ink dark:text-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <IsteMark shine className="h-12 w-12" />
            <p className="font-display text-lg font-semibold leading-tight">
              ISTE – Easwari<br />Student Chapter
            </p>
          </div>
          <p className="mt-3 text-sm text-ink/70 dark:text-white/70">Indian Society for Technical Education</p>
        </div>

        <div className="text-sm text-ink/80 dark:text-white/80">
          <p className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-turkish" />
            <span>Easwari Engineering College<br />Bharathi Salai, Ramapuram<br />Chennai 600089, Tamil Nadu</span>
          </p>
          <span className="mt-4 inline-flex rounded-sm bg-white px-2 py-1">
            <EaswariMark className="h-9" plate />
          </span>
        </div>

        <div className="sm:justify-self-end">
          <p className="text-sm text-ink/70 dark:text-white/70">Follow the chapter</p>
          <div className="mt-3 flex gap-3">
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"
              className="rounded-sm border border-ink/25 p-2.5 transition hover:border-turkish hover:text-turkish-dark dark:border-white/30 dark:hover:text-turkish-light">
              <Linkedin size={20} />
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"
              className="rounded-sm border border-ink/25 p-2.5 transition hover:border-turkish hover:text-turkish-dark dark:border-white/30 dark:hover:text-turkish-light">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-ink/15 dark:border-white/15">
        <div className="container-page py-4 text-xs text-ink/50 dark:text-white/50">
          © {new Date().getFullYear()} ISTE Easwari Student Chapter.
        </div>
      </div>
    </footer>
  )
}
