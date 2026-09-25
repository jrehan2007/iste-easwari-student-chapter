import { useState } from 'react'
import { submitFeedback } from '../lib/api'

const PRESIDENT = import.meta.env.VITE_PRESIDENT_EMAIL ?? 'president@iste-easwari.in'
const VP = import.meta.env.VITE_VP_EMAIL ?? 'vicepresident@iste-easwari.in'

export default function FeedbackSection() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!form.name || !form.email || !form.message) return setError('Fill in all three fields.')
    setError(null)
    setLoading(true)
    try {
      // Stored in Supabase so the President and VP see every submission in the dashboard.
      await submitFeedback(form)
      // Also opens their mail client so it lands in the inbox immediately.
      const subject = encodeURIComponent(`Chapter feedback from ${form.name}`)
      const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)
      window.location.href = `mailto:${PRESIDENT}?cc=${VP}&subject=${subject}&body=${body}`
      setSent(true)
      setForm({ name: '', email: '', message: '' })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="feedback" className="container-page py-10 sm:py-16 scroll-mt-28">
      <h2 className="section-title">Feedback</h2>
      <p className="muted mt-2 sm:mt-3 text-sm sm:text-base">Goes straight to the President and Vice President.</p>
      <div className="rule mt-3 sm:mt-4" />

      <div className="mt-6 sm:mt-8 grid gap-6 sm:gap-8 lg:grid-cols-2">
        <form onSubmit={submit} className="card space-y-4 p-4 sm:p-6">
          <div>
            <label className="mb-1 block text-xs sm:text-sm muted font-medium" htmlFor="fb-name">Your name</label>
            <input
              id="fb-name"
              className="field min-h-[44px] text-sm sm:text-base"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs sm:text-sm muted font-medium" htmlFor="fb-email">Email</label>
            <input
              id="fb-email"
              type="email"
              className="field min-h-[44px] text-sm sm:text-base"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs sm:text-sm muted font-medium" htmlFor="fb-msg">What should we know?</label>
            <textarea
              id="fb-msg"
              rows={5}
              className="field text-sm sm:text-base"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write your feedback, suggestions, or queries here..."
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary min-h-[44px] w-full sm:w-auto text-center justify-center">
            {loading ? 'Sending...' : 'Send feedback'}
          </button>
          {error && <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">{error}</p>}
          {sent && <p className="text-xs sm:text-sm text-turkish-dark dark:text-turkish-light font-medium">Sent. Your mail app should also be open with a copy.</p>}
        </form>

        <div className="flex flex-col">
          <h3 className="text-lg sm:text-xl font-semibold text-ink dark:text-white">Find us</h3>
          <p className="muted mt-1 text-xs sm:text-sm">Easwari Engineering College, Bharathi Salai, Ramapuram, Chennai 600089.</p>
          <iframe
            title="Easwari Engineering College on Google Maps"
            className="mt-3 sm:mt-4 h-60 sm:h-80 w-full rounded-sm border border-turkish/25"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=Easwari+Engineering+College+Ramapuram+Chennai&output=embed"
          />
        </div>
      </div>
    </section>
  )
}
