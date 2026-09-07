import { Link } from 'react-router-dom'
import IntroHero from '../components/IntroHero'
import EmptyState from '../components/EmptyState'
import { useAsync } from '../lib/useAsync'
import { listAnnouncements, listEvents } from '../lib/api'

export default function Home() {
  const posts = useAsync(() => listAnnouncements(3), [])
  const upcoming = useAsync(() => listEvents('upcoming'), [])

  return (
    <>
      <IntroHero />

      <section className="container-page py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="section-title">Preview &amp; announcements</h2>
          <Link to="/pin-board" className="text-turkish-dark hover:underline dark:text-turkish-light">Open the pin board</Link>
        </div>
        <div className="rule mt-4" />

        {posts.loading ? <p className="muted mt-8">Loading…</p>
          : !posts.data?.length ? <EmptyState title="No posts yet" hint="Publish one from the admin pin board." />
          : (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {posts.data.map((a) => (
                <article key={a.id} className="card flex flex-col">
                  <p className="text-sm text-turkish-dark dark:text-turkish-light">
                    {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {a.source === 'instagram' && ' · from Instagram'}
                  </p>
                  <h3 className="mt-2 text-xl">{a.title}</h3>
                  <p className="muted mt-2 flex-1">{a.body}</p>
                </article>
              ))}
            </div>
          )}
      </section>

      <section className="bg-turkish-mist py-16 dark:bg-night-soft">
        <div className="container-page">
          <h2 className="section-title">Next on the calendar</h2>
          <div className="rule mt-4" />
          {upcoming.loading ? <p className="muted mt-8">Loading…</p>
            : !upcoming.data?.length ? <EmptyState title="No upcoming events" hint="Add one from the admin dashboard." />
            : (
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {upcoming.data.slice(0, 2).map((e) => (
                  <article key={e.id} className="card">
                    <h3 className="text-2xl">{e.title}</h3>
                    <p className="muted mt-2">{e.description}</p>
                    <dl className="muted mt-4 space-y-1 text-sm">
                      <div><dt className="inline font-bold">Venue: </dt><dd className="inline">{e.venue}</dd></div>
                      <div><dt className="inline font-bold">When: </dt>
                        <dd className="inline">{new Date(e.starts_at).toLocaleString('en-IN')}</dd></div>
                    </dl>
                    <Link to={`/events/${e.id}/register`} className="btn-primary mt-5">Register</Link>
                  </article>
                ))}
              </div>
            )}
        </div>
      </section>
    </>
  )
}
