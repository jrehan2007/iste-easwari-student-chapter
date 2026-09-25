import { Linkedin, Instagram, MapPin } from 'lucide-react'
import { EaswariMark, IsteMark } from './Logo'

export default function Footer() {
  return (
    <footer className="mt-12 sm:mt-20 border-t-2 border-turkish bg-[#E8F1F4] text-ink dark:bg-ink dark:text-white">
      <div className="container-page grid gap-6 sm:gap-8 py-8 sm:py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <IsteMark shine className="h-10 w-10 sm:h-12 sm:w-12 shrink-0" />
            <p className="font-display text-base sm:text-lg font-semibold leading-tight">
              ISTE – Easwari<br />Student Chapter
            </p>
          </div>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-ink/70 dark:text-white/70">Indian Society for Technical Education</p>
        </div>

        <div className="text-xs sm:text-sm text-ink/80 dark:text-white/80">
          <p className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-turkish" />
            <span>Easwari Engineering College<br />Bharathi Salai, Ramapuram<br />Chennai 600089, Tamil Nadu</span>
          </p>
          <span className="mt-3.5 sm:mt-4 inline-flex">
            <EaswariMark className="h-8 sm:h-9" tone="auto" />
          </span>
        </div>

        <div className="sm:justify-self-end">
          <p className="text-xs sm:text-sm text-ink/70 dark:text-white/70">Follow the chapter</p>
          <div className="mt-2.5 sm:mt-3 flex gap-3">
            {/* No chapter LinkedIn page yet: shown, but switched off */}
            <span aria-disabled="true" aria-label="LinkedIn (coming soon)" title="LinkedIn — coming soon"
              className="flex h-11 w-11 items-center justify-center cursor-not-allowed rounded-sm border border-ink/15 text-ink/35 dark:border-white/15 dark:text-white/30">
              <Linkedin size={20} />
            </span>
            <a href="https://www.instagram.com/srm.iste_eec" target="_blank" rel="noreferrer" aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-sm border border-ink/25 transition hover:border-turkish hover:text-turkish-dark dark:border-white/30 dark:hover:text-turkish-light">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-ink/15 dark:border-white/15">
        <div className="container-page py-3.5 sm:py-4 text-center sm:text-left text-[11px] sm:text-xs text-ink/50 dark:text-white/50">
          © {new Date().getFullYear()} ISTE Easwari Student Chapter · All rights reserved.
        </div>
      </div>
    </footer>
  )
}
