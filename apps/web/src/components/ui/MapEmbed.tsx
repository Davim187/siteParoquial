import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'
import { mapsEmbedSrc } from '@/utils/maps'

export function MapEmbed({
  mapsUrl,
  address,
  title = 'Mapa da paróquia',
  className,
}: {
  mapsUrl?: string
  address?: string
  title?: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setActive(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setActive(true)
        observer.disconnect()
      },
      { rootMargin: '240px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'relative min-h-[240px] w-full overflow-hidden rounded-2xl border border-line bg-line/30 shadow-sm',
        className,
      )}
    >
      {active ? (
        <iframe
          title={title}
          src={mapsEmbedSrc(mapsUrl, address)}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-beige" aria-hidden="true" />
      )}
    </div>
  )
}
