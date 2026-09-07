import { Instagram, ExternalLink } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useAsync } from '../lib/useAsync'
import { listAnnouncements } from '../lib/api'

export default function PinBoard() {
  const { data, loading } = useAsync(() => listAnnouncements(), [])

  return (
    <div className="container-page py-14">
      <h1 className="section-title">Pin board</h1>
      <p className="muted mt-3 max-w-2xl">
        Chapter notices and reposts from our Instagram, pinned as they happen.
      </p>
      <div className="rule mt-5" />

      {loading ? <p className="muted mt-8">Loading…</p>
        : !data?.length ? <EmptyState title="Nothing pinned yet" hint="Publish a post from the admin pin board panel." />
        : (
          <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
            {data.map((a, i) => (
              <article key={a.id}
                className="break-inside-avoid border border-turkish/25 bg-white p-5 dark:border-night-line dark:bg-night-soft"
                style={{ transform: `rotate(${(i % 3) - 1}deg)` }}>
                <span className="mx-auto mb-3 block h-3 w-3 rounded-full bg-turkish" />
                <p className="text-sm text-turkish-dark dark:text-turkish-light">
                  {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <h2 className="mt-1 text-xl">{a.title}</h2>
                {a.image_url && <img src={a.image_url} alt="" className="mt-3 w-full" />}
                <p className="muted mt-2">{a.body}</p>
                {a.source === 'instagram' && a.external_url && (
                  <a href={a.external_url} target="_blank" rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm text-turkish-dark hover:underline dark:text-turkish-light">
                    <Instagram size={16} /> View on Instagram <ExternalLink size={14} />
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
    </div>
  )
}
