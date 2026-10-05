import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { mediaUrl } from '@/lib/api-client'
import { feastDescriptionLines } from '@/services/feast'
import type { PatronFeast } from '@/types'

export function PatronFeastBanner({ feast }: { feast: PatronFeast }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = imageFailed ? '' : mediaUrl(feast.image)
  const lines = feastDescriptionLines(feast.description)

  return (
    <section className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 sm:flex-row sm:items-center md:px-6 md:py-6">
        {image ? (
          <img
            src={image}
            alt=""
            onError={() => setImageFailed(true)}
            className="h-52 w-full shrink-0 rounded-xl object-cover sm:h-56 sm:w-48"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
            Festa da Padroeira
          </p>
          <h2 className="mt-1 font-serif text-xl leading-snug">{feast.title}</h2>
          {feast.dateLabel ? <p className="mt-1 text-sm text-white/80">{feast.dateLabel}</p> : null}
          {lines.some((line) => line.trim() !== '') ? (
            <div className="mt-3 max-w-3xl space-y-2 text-sm leading-relaxed text-white/85">
              {lines.map((line, index) =>
                line.trim() === '' ? (
                  <div key={index} className="h-1" aria-hidden />
                ) : (
                  <p key={index}>{line}</p>
                ),
              )}
            </div>
          ) : null}
          <Button href="/festa-da-padroeira" variant="gold" size="sm" className="mt-4">
            Ver programação
          </Button>
        </div>
      </div>
    </section>
  )
}
