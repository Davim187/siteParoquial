import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { mediaUrl } from '@/lib/api-client'
import type { PatronFeast } from '@/types'

export function PatronFeastBanner({ feast }: { feast: PatronFeast }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = imageFailed ? '' : mediaUrl(feast.image)

  return (
    <section className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center md:px-6 md:py-5">
        {image ? (
          <img
            src={image}
            alt=""
            onError={() => setImageFailed(true)}
            className="h-24 w-full shrink-0 rounded-xl object-cover sm:h-28 sm:w-40"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
            Festa da Padroeira
          </p>
          <h2 className="mt-1 font-serif text-xl leading-snug">{feast.title}</h2>
          {feast.dateLabel ? <p className="mt-1 text-sm text-white/80">{feast.dateLabel}</p> : null}
        </div>
        <Button href="/festa-da-padroeira" variant="gold" size="sm" className="shrink-0 self-start sm:self-center">
          Ver programação
        </Button>
      </div>
    </section>
  )
}
