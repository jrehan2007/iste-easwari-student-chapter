import { useState } from 'react'
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
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {folders.data.map((f) => (
              <button key={f.id} onClick={() => setOpenFolder({ id: f.id, name: f.name })}
                className="card text-left hover:border-turkish">
                <div className="flex h-40 items-center justify-center overflow-hidden bg-turkish-mist dark:bg-night">
                  {f.cover_url ? <img src={f.cover_url} alt="" className="h-full w-full object-cover" />
                    : <IsteMark className="h-16 w-16 opacity-40" />}
                </div>
                <h2 className="mt-4 text-xl">{f.name}</h2>
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <button onClick={() => setOpenFolder(null)} className="mt-6 text-turkish-dark hover:underline dark:text-turkish-light">
            ← All albums
          </button>
          <h2 className="mt-3 text-2xl">{openFolder.name}</h2>
          {photos.loading ? <p className="muted mt-6">Loading…</p>
            : !photos.data?.length ? <EmptyState title="This album is empty" />
            : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.data.map((p) => (
                  <figure key={p.id} className="border border-turkish/20 dark:border-night-line">
                    <img src={p.photo_url} alt={p.caption ?? ''} className="h-32 w-full object-cover sm:h-40" />
                    {p.caption && <figcaption className="muted p-2 text-xs">{p.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}
        </>
      )}
    </div>
  )
}
