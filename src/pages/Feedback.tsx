import { useState } from 'react'
import { submitFeedback } from '../lib/api'

const PRESIDENT = import.meta.env.VITE_PRESIDENT_EMAIL ?? 'president@iste-easwari.in'
const VP = import.meta.env.VITE_VP_EMAIL ?? 'vicepresident@iste-easwari.in'

export default function Feedback() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  async function submit() {
    if (!form.name || !form.email || !form.message) return setError('Fill in all three fields.')
    setError(null)
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
    }
  }

  return (
    <div className="container-page py-14">
      <h1 className="section-title">Feedback</h1>
      <p className="muted mt-3">Goes straight to the President and Vice President.</p>
      <div className="rule mt-5" />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm muted" htmlFor="fb-name">Your name</label>
            <input id="fb-name" className="field" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm muted" htmlFor="fb-email">Email</label>
            <input id="fb-email" type="email" className="field" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm muted" htmlFor="fb-msg">What should we know?</label>
            <textarea id="fb-msg" rows={6} className="field" value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <button onClick={submit} className="btn-primary">Send feedback</button>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {sent && <p className="text-turkish-dark dark:text-turkish-light">Sent. Your mail app should also be open with a copy.</p>}
        </div>

        <div>
          <h2 className="text-xl">Find us</h2>
          <p className="muted mt-1">Easwari Engineering College, Bharathi Salai, Ramapuram, Chennai 600089.</p>
          <iframe
            title="Easwari Engineering College on Google Maps"
            className="mt-4 h-80 w-full border border-turkish/25"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=Easwari+Engineering+College+Ramapuram+Chennai&output=embed"
          />
        </div>
      </div>
    </div>
  )
}
