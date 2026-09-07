import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { getEvent } from '../lib/api'

export default function EventRegister() {
  const { id } = useParams()
  const { data: event, loading } = useAsync(() => getEvent(id!), [id])

  if (loading) return <div className="container-page py-24 muted">Loading…</div>
  if (!event) return <div className="container-page py-24 muted">That event isn’t listed.</div>

  return (
    <div className="container-page py-14">
      <Link to="/events" className="text-turkish-dark hover:underline dark:text-turkish-light">← Back to events</Link>
      <h1 className="section-title mt-4">Register — {event.title}</h1>
      <p className="muted mt-2">{event.venue} · {new Date(event.starts_at).toLocaleString('en-IN')}</p>
      {Boolean(event.member_discount_pct) && (
        <p className="mt-3 rounded-sm bg-turkish-mist px-4 py-2 text-turkish-dark dark:bg-night-soft dark:text-turkish-light">
          Members pay {event.member_discount_pct}% less and register two days before this opens publicly.
        </p>
      )}
      <div className="rule mt-5" />

      <div className="mt-8 overflow-hidden rounded-sm border border-turkish/25 dark:border-night-line">
        {event.google_form_url ? (
          <iframe title={`${event.title} registration form`} src={event.google_form_url}
            className="h-[1100px] w-full bg-white" loading="lazy" />
        ) : (
          <p className="muted p-8">
            No registration form attached yet. An admin adds the Google Form link from the dashboard.
          </p>
        )}
      </div>
    </div>
  )
}
