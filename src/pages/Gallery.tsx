import { useState, useEffect } from 'react'
import { ArrowRight, X } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { IsteMark } from '../components/Logo'
import { useAsync } from '../lib/useAsync'
import { listFolders, listPhotos } from '../lib/api'
import type { GalleryPhoto } from '../lib/types'

export default function Gallery() {
  const [openFolder, setOpenFolder] = useState<{ id: string; name: string } | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)
  const folders = useAsync(() => listFolders(), [])
  const photos = useAsync(() => (openFolder ? listPhotos(openFolder.id) : Promise.resolve([])), [openFolder?.id])

  // Prevent background scroll when lightbox is open
  useEffect(() => {
    if (selectedPhoto) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [selectedPhoto])

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null)
    }
    if (selectedPhoto) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPhoto])

  return (
    <div className="container-page py-8 sm:py-14">
      <h1 className="section-title">Gallery</h1>
      <p className="muted mt-2 sm:mt-3 text-sm sm:text-base">Photos are filed by event.</p>
      <div className="rule mt-4 sm:mt-5" />

      {!openFolder ? (
        folders.loading ? <p className="muted mt-6 sm:mt-8">Loading…</p>
        : !folders.data?.length ? <EmptyState title="No albums yet" hint="Create a folder in the admin gallery panel, then upload photos." />
        : (
          <div className="mt-6 sm:mt-10 grid gap-5 sm:gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {folders.data.map((f) => (
              <button key={f.id} type="button" onClick={() => setOpenFolder({ id: f.id, name: f.name })}
                className="event-card card-glow-red text-left">
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
          <button onClick={() => setOpenFolder(null)} className="mt-5 sm:mt-6 py-2 text-sm sm:text-base text-turkish-dark hover:underline dark:text-turkish-light">
            ← All albums
          </button>
          <h2 className="mt-2 min-w-0 break-words text-xl font-bold sm:text-2xl">{openFolder.name}</h2>
          {photos.loading ? <p className="muted mt-6">Loading…</p>
            : !photos.data?.length ? <EmptyState title="This album is empty" />
            : (
              <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2.5 xs:gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.data.map((p) => (
                  <figure
                    key={p.id}
                    onClick={() => setSelectedPhoto(p)}
                    className="group cursor-pointer overflow-hidden rounded-sm border border-turkish/20 transition hover:border-turkish dark:border-night-line m-0"
                  >
                    <img
                      src={p.photo_url}
                      alt={p.caption ?? ''}
                      className="aspect-square w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                    {p.caption && (
                      <figcaption className="muted truncate p-1.5 sm:p-2 text-[11px] sm:text-xs">
                        {p.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
        </>
      )}

      {/* Responsive Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex max-h-[90vh] max-w-[95vw] flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-11 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/40 focus:outline-none"
              aria-label="Close photo preview"
            >
              <X size={22} />
            </button>
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption ?? 'Photo full view'}
              className="max-h-[80vh] max-w-[92vw] rounded-sm object-contain shadow-2xl"
            />
            {selectedPhoto.caption && (
              <p className="mt-3 max-w-lg text-center text-xs sm:text-sm text-white/90">
                {selectedPhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
