import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { IsteMark } from '../components/Logo'
import { useAsync } from '../lib/useAsync'
import { listFolders, listPhotos } from '../lib/api'

export default function Gallery() {
  const [openFolder, setOpenFolder] = useState<{ id: string; name: string } | null>(null)
  const folders = useAsync(() => listFolders(), [])
  const photos = useAsync(() => (openFolder ? listPhotos(openFolder.id) : Promise.resolve([])), [openFolder?.id])

  return (
    <div className="container-page py-14">
      <h1 className="section-title">Gallery</h1>
      <p className="muted mt-3">Photos are filed by event.</p>
      <div className="rule mt-5" />

      {!openFolder ? (
        folders.loading ? <p className="muted mt-8">Loading…</p>
        : !folders.data?.length ? <EmptyState title="No albums yet" hint="Create a folder in the admin gallery panel, then upload photos." />
        : (
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {folders.data.map((f) => (
              <button key={f.id} type="button" onClick={() => setOpenFolder({ id: f.id, name: f.name })}
                className="event-card card-glow-red">
                <div className="event-card-banner">
                  {f.cover_url ? <img src={f.cover_url} alt="" loading="lazy" className="event-card-image" />
                    : <IsteMark className="event-card-mark" />}
                </div>
                <div className="event-card-body">
                  <p className="event-card-kicker">Album</p>
                  <h2 className="event-card-title">{f.name}</h2>
                  <div className="event-card-action-row">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-turkish-light">
                      View photos <ArrowRight size={16} aria-hidden />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <button onClick={() => setOpenFolder(null)} className="mt-6 py-2 text-turkish-dark hover:underline dark:text-turkish-light">
            ← All albums
          </button>
          <h2 className="mt-2 text-2xl">{openFolder.name}</h2>
          {photos.loading ? <p className="muted mt-6">Loading…</p>
            : !photos.data?.length ? <EmptyState title="This album is empty" />
            : (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {photos.data.map((p) => (
                  <figure key={p.id} className="m-0">
                    {/* Tap to see the full photo */}
                    <a href={p.photo_url} target="_blank" rel="noreferrer" className="photo-tile"
                      aria-label={p.caption ? `Open photo: ${p.caption}` : 'Open photo'}>
                      <img src={p.photo_url} alt={p.caption ?? ''} loading="lazy" className="aspect-square w-full object-cover" />
                    </a>
                    {p.caption && <figcaption className="muted mt-2 text-xs">{p.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}
        </>
      )}
    </div>
  )
}
