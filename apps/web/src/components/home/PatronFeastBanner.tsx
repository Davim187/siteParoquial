import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { mediaUrl } from '@/lib/api-client'
import { feastDescriptionLines } from '@/services/feast'
import type { PatronFeast } from '@/types'
import { formatShortDate } from '@/utils/dates'

export function PatronFeastBanner({ feast }: { feast: PatronFeast }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = imageFailed ? '' : mediaUrl(feast.image)
  const lines = feastDescriptionLines(feast.description)

  return (
    <section className="bg-navy text-white">
      <div
        className={`mx-auto grid max-w-6xl gap-10 px-4 py-14 md:px-6 ${
          image ? 'md:grid-cols-[minmax(0,1.15fr)_minmax(220px,380px)] md:items-start' : ''
        }`}
      >
        <div className={image ? 'min-w-0' : 'max-w-3xl'}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Padroeira</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">{feast.title}</h2>
          {feast.dateLabel ? <p className="mt-2 text-gold">{feast.dateLabel}</p> : null}
          {lines.some((line) => line.trim() !== '') ? (
            <div className="mt-5 space-y-2 text-base leading-relaxed text-white/85">
              {lines.map((line, index) =>
                line.trim() === '' ? (
                  <div key={index} className="h-2" aria-hidden />
                ) : (
                  <p key={index}>{line}</p>
                ),
              )}
            </div>
          ) : null}
          {feast.program.length > 0 ? <ProgramList items={feast.program} className="mt-8" /> : null}
          <Button href="/nossa-paroquia#padroeira" variant="gold" className="mt-6">
            Ver programação
          </Button>
        </div>
        {image ? (
          <img
            src={image}
            alt=""
            onError={() => setImageFailed(true)}
            className="aspect-[4/5] w-full rounded-2xl object-cover shadow-lg"
          />
        ) : null}
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
  return (
    <ol className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-gold">
            {item.date ? `${formatShortDate(item.date)} · ` : ''}
            {item.time}
          </p>
          <p className="mt-1 font-medium">{item.title}</p>
          {item.description ? (
            <div className="mt-1 space-y-1 text-sm leading-relaxed text-white/70">
              {feastDescriptionLines(item.description).map((line, index) =>
                line.trim() === '' ? (
                  <div key={index} className="h-1" aria-hidden />
                ) : (
                  <p key={index}>{line}</p>
                ),
              )}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
