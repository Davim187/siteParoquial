import { useState } from 'react'
import type { GalleryItem } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { galleryLabels } from '@/utils/labels'

export function Gallery({ items }: { items: GalleryItem[] }) {
  const [current, setCurrent] = useState<GalleryItem | null>(null)

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setCurrent(item)}
              className="group relative block w-full overflow-hidden rounded-xl focus-visible:outline-none"
            >
              <img
                src={item.src}
                alt={item.alt}
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute inset-x-0 bottom-0 bg-navy-deep/70 p-2 text-left text-xs text-white opacity-0 transition group-hover:opacity-100">
                {item.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Modal open={Boolean(current)} onClose={() => setCurrent(null)} title={current?.title}>
        {current ? (
          <div>
            <img src={current.src} alt={current.alt} className="max-h-[70vh] w-full rounded-xl object-contain" />
            <p className="mt-3 text-sm text-muted">{galleryLabels[current.category]}</p>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
