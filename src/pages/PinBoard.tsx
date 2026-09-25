import EmptyState from '../components/EmptyState'
import AnnouncementLink from '../components/AnnouncementLink'
import { IsteMark } from '../components/Logo'
import { useAsync } from '../lib/useAsync'
import { listAnnouncements } from '../lib/api'

export default function PinBoard() {
  const { data, loading } = useAsync(() => listAnnouncements(), [])

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="section-title">Pin board</h1>
      <p className="muted mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base">
        Chapter notices and reposts from our Instagram, pinned as they happen.
      </p>
      <div className="rule mt-4 sm:mt-5" />

      {loading ? <p className="muted mt-6 sm:mt-8">Loading…</p>
        : !data?.length ? <EmptyState title="Nothing pinned yet" hint="Publish a post from the admin pin board panel." />
        : (
          <div className="mt-6 sm:mt-10 grid gap-5 sm:gap-7 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {data.map((a) => {
              // The admin form saves the message as both title and body; show it once.
              const body = a.body && a.body.trim() !== a.title.trim() ? a.body : null
              return (
                <article key={a.id} role="listitem" className="event-card card-glow-red">
                  {a.image_url && (
                    <div className="event-card-banner">
                      <img src={a.image_url} alt="" loading="lazy" className="event-card-image" />
                    </div>
                  )}
                  <div className="event-card-body">
                    <div className="event-card-topline">
                      <p className="event-card-kicker">
                        {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {a.source === 'instagram' && ' · Instagram'}
                      </p>
                      {!a.image_url && <IsteMark className="h-7 w-7 shrink-0 opacity-70" />}
                    </div>
                    <h2 className="event-card-title is-full [overflow-wrap:anywhere]">{a.title}</h2>
                    {body && <p className="event-card-copy is-full [overflow-wrap:anywhere]">{body}</p>}
                    {a.external_url && (
                      <div className="event-card-action-row">
                        <AnnouncementLink href={a.external_url} onDark />
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
    </div>
  )
}
