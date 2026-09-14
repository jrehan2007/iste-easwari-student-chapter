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
    <div className="container-page py-14">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="section-title">{s?.headline || 'Membership'}</h1>
          {s?.intro && <p className="muted mt-3 max-w-2xl leading-relaxed">{s.intro}</p>}
        </div>
        <IsteMark shine className="hidden h-20 w-20 sm:block" />
      </div>
      <div className="rule mt-5" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div>
          {perks.length > 0 && (
            <>
              <h2 className="font-display text-xl font-semibold">What you get</h2>
              <ul className="mt-4 space-y-3">
                {perks.map((p, i) => (
                  <motion.li key={p}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="flex items-start gap-3 border-b border-turkish/15 pb-3 dark:border-night-line">
                    <Check className="mt-0.5 shrink-0 text-turkish" size={20} /> {p}
                  </motion.li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="h-fit border-2 border-gold bg-[#E8F1F4] p-7 text-ink dark:bg-ink dark:text-white">
          {open ? (
            <>
              <p className="tracking-widest text-gold-light">MEMBERSHIP</p>
              <p className="font-display mt-2 text-5xl font-semibold">{s?.price_label}</p>
              {s?.price_note && <p className="mt-2 text-ink/70 dark:text-white/70">{s.price_note}</p>}
              {s?.closes_on && (
                <p className="mt-3 text-sm text-gold-light">
                  Applications close {new Date(s.closes_on).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {s?.google_form_url ? (
                <a href={s.google_form_url} target="_blank" rel="noreferrer"
                  className="mt-6 block rounded-sm bg-gold px-5 py-3 text-center text-ink transition hover:bg-gold-light">
                  Apply for membership
                </a>
              ) : (
                <p className="mt-6 text-sm text-ink/60 dark:text-white/60">
                  The application form hasn't been linked yet. Check back shortly.
                </p>
              )}
              <p className="mt-4 text-xs text-ink/60 dark:text-white/50">
                Once your application is approved, the chapter secretary hands you your sign-in
                details and your digital ID card becomes available.
              </p>
            </>
          ) : (
            <>
              <Lock className="text-gold-light" size={28} />
              <p className="font-display mt-4 text-2xl font-semibold">Registration closed</p>
              <p className="mt-3 leading-relaxed text-ink/75 dark:text-white/75">{s?.closed_message}</p>
              {s?.opens_on && (
                <p className="mt-4 text-sm text-gold-light">
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
