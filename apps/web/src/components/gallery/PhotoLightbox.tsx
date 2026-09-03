import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GalleryPhoto } from '@/types'

function preload(url?: string) {
  if (!url) return
  const image = new Image()
  image.src = url
}

export function PhotoLightbox({
  photos,
  initialIndex = 0,
  onClose,
}: {
  photos: GalleryPhoto[]
  initialIndex?: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [shownIndex, setShownIndex] = useState(initialIndex)
  const shown = photos[shownIndex]
  const pending = photos[index]
  const touchStartX = useRef<number | null>(null)

  const goPrev = useCallback(() => {
    setIndex((value) => (value === 0 ? photos.length - 1 : value - 1))
  }, [photos.length])

  const goNext = useCallback(() => {
    setIndex((value) => (value === photos.length - 1 ? 0 : value + 1))
  }, [photos.length])

  useEffect(() => {
    const photo = photos[index]
    if (!photo) return

    const image = new Image()
    const reveal = () => setShownIndex(index)
    image.onload = reveal
    image.onerror = reveal
    image.src = photo.url
    if (image.complete) reveal()

    preload(photos[(index + 1) % photos.length]?.url)
    preload(photos[(index - 1 + photos.length) % photos.length]?.url)

    return () => {
      image.onload = null
      image.onerror = null
    }
  }, [index, photos])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev, onClose])

  if (!shown || !pending) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Visualização ampliada"
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current
        const end = event.changedTouches[0]?.clientX
        touchStartX.current = null
        if (start == null || end == null) return
        const delta = end - start
        if (Math.abs(delta) < 40) return
        if (delta > 0) goPrev()
        else goNext()
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Fechar"
      >
        <X className="h-6 w-6" />
      </button>

      {photos.length > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-4"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-4"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      ) : null}

      <div className="flex max-h-[90vh] max-w-5xl flex-col items-center">
        <img
          src={shown.url}
          alt={shown.title ?? shown.originalName ?? 'Foto da galeria'}
          className="max-h-[75vh] max-w-full rounded-lg object-contain"
        />
        <div className="mt-3 text-center text-white">
          {shown.title ? <p className="font-medium">{shown.title}</p> : null}
          <p className="text-sm text-white/70">
            {shownIndex + 1} de {photos.length}
          </p>
        </div>
      </div>
    </div>
  )
}

export function PhotoGrid({
  photos,
  onPhotoClick,
}: {
  photos: GalleryPhoto[]
  onPhotoClick: (index: number) => void
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo, photoIndex) => (
        <li key={photo.id}>
          <button
            type="button"
            onClick={() => onPhotoClick(photoIndex)}
            className="group relative block w-full overflow-hidden rounded-xl focus-visible:outline-none"
          >
            <img
              src={photo.thumbUrl}
              alt={photo.title ?? photo.originalName ?? 'Foto'}
              className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        </li>
      ))}
    </ul>
  )
}
