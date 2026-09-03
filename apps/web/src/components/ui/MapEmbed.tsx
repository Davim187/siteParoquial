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
  return (
    <div
      className={cn(
        'relative min-h-[240px] w-full overflow-hidden rounded-2xl border border-line bg-line/30 shadow-sm',
        className,
      )}
    >
      <iframe
        title={title}
        src={mapsEmbedSrc(mapsUrl, address)}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
