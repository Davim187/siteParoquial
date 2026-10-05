import { Button } from '@/components/ui/Button'
import { mediaUrl } from '@/lib/api-client'
import type { PatronFeast } from '@/types'
import { formatShortDate } from '@/utils/dates'

export function PatronFeastBanner({ feast }: { feast: PatronFeast }) {
  if (!feast.enabled) return null
  const image = mediaUrl(feast.image)
  return (
    <section className="bg-navy text-white">
      <div
        className={`mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:px-6 ${
          image ? 'md:grid-cols-[1.15fr_0.85fr]' : 'md:grid-cols-[1.2fr_1fr]'
        }`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Padroeira</p>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl">{feast.title}</h2>
          <p className="mt-2 text-gold">{feast.dateLabel}</p>
          <p className="mt-4 max-w-xl text-white/80">{feast.description}</p>
          {image && feast.program.length > 0 ? (
            <ProgramList items={feast.program} className="mt-8" />
          ) : null}
          <Button href="/nossa-paroquia#padroeira" variant="gold" className="mt-6">
            Ver programação
          </Button>
        </div>
        {image ? (
          <img
            src={image}
            alt=""
            className="aspect-[4/5] w-full rounded-2xl object-cover shadow-lg"
          />
        ) : (
          <ProgramList items={feast.program} />
        )}
      </div>
    </section>
  )
}

function ProgramList({
  items,
  className = '',
}: {
  items: PatronFeast['program']
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <ol className={`space-y-3 ${className}`}>
      {items.slice(0, 4).map((item) => (
        <li key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-gold">
            {item.date ? `${formatShortDate(item.date)} · ` : ''}
            {item.time}
          </p>
          <p className="mt-1 font-medium">{item.title}</p>
          {item.description ? <p className="text-sm text-white/70">{item.description}</p> : null}
        </li>
      ))}
    </ol>
  )
}
