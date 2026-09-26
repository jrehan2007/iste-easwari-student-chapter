import { Check, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAsync } from '../lib/useAsync'
import { getMembershipSettings } from '../lib/api'
import { IsteMark } from '../components/Logo'

/**
 * Entirely driven by the admin's Membership page panel — headline, intro,
 * perks, price, whether registration is open, and the form link.
 */
export default function Membership() {
  const { data: s, loading } = useAsync(() => getMembershipSettings(), [])

  if (loading) return <div className="container-page py-24 muted">Loading…</div>

  const perks = s?.perks ?? []
  const open = Boolean(s?.is_open)

  return (
    <div className="container-page py-8 sm:py-14">
      <div className="flex items-start justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1 className="section-title">{s?.headline || 'Membership'}</h1>
          {s?.intro && <p className="muted mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base leading-relaxed">{s.intro}</p>}
        </div>
        <IsteMark shine className="hidden h-16 w-16 sm:block sm:h-20 sm:w-20 shrink-0" />
      </div>
      <div className="rule mt-4 sm:mt-5" />

      <div className="mt-8 sm:mt-10 grid gap-6 sm:gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div>
          {perks.length > 0 && (
            <>
              <h2 className="font-display text-lg sm:text-xl font-semibold">What you get</h2>
              <ul className="mt-4 space-y-3">
                {perks.map((p, i) => (
                  <motion.li key={p}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="flex items-start gap-2.5 sm:gap-3 border-b border-turkish/15 pb-3 text-sm sm:text-base dark:border-night-line">
                    <Check className="mt-0.5 shrink-0 text-turkish" size={18} /> {p}
                  </motion.li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="h-fit min-w-0 rounded-sm border-2 border-gold bg-[#E8F1F4] p-5 text-ink shadow-sm sm:p-7 dark:bg-ink dark:text-white">
          {open ? (
            <>
              <p className="text-xs sm:text-sm font-semibold tracking-widest text-gold-deep dark:text-gold-light">MEMBERSHIP</p>
              <p className="font-display mt-2 break-words text-3xl font-semibold xs:text-4xl sm:text-5xl">{s?.price_label}</p>
              {s?.price_note && <p className="mt-2 text-xs sm:text-sm text-ink/70 dark:text-white/70">{s.price_note}</p>}
              {s?.closes_on && (
                <p className="mt-3 text-xs sm:text-sm font-medium text-gold-deep dark:text-gold-light">
                  Applications close {new Date(s.closes_on).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {s?.google_form_url ? (
                <a href={s.google_form_url} target="_blank" rel="noreferrer"
                  className="mt-6 flex min-h-[44px] items-center justify-center rounded-sm bg-gold px-5 py-3 text-center text-sm sm:text-base font-semibold text-ink transition hover:bg-gold-light shadow-sm">
                  Apply for membership
                </a>
              ) : (
                <p className="mt-6 text-xs sm:text-sm text-ink/60 dark:text-white/60">
                  The application form hasn't been linked yet. Check back shortly.
                </p>
              )}
              <p className="mt-4 text-[11px] sm:text-xs leading-relaxed text-ink/60 dark:text-white/50">
                Once your application is approved, the chapter secretary hands you your sign-in
                details and your digital ID card becomes available.
              </p>
            </>
          ) : (
            <>
              <Lock className="text-gold-deep dark:text-gold-light" size={28} />
              <p className="font-display mt-3 sm:mt-4 text-xl sm:text-2xl font-semibold">Registration closed</p>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-ink/75 dark:text-white/75">{s?.closed_message}</p>
              {s?.opens_on && (
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-gold-deep dark:text-gold-light">
                  Next intake opens {new Date(s.opens_on).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
