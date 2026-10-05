import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { mediaUrl } from '@/lib/api-client'
import type { PatronFeast } from '@/types'

export function PatronFeastBanner({ feast }: { feast: PatronFeast }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = imageFailed ? '' : mediaUrl(feast.image)

  return (
    <article className="flex overflow-hidden rounded-2xl bg-navy text-white shadow-sm">
      {image ? (
        <img
          src={image}
          alt=""
          onError={() => setImageFailed(true)}
          className="h-36 w-28 shrink-0 object-cover sm:h-auto sm:w-44"
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
          Festa da Padroeira
        </p>
        <h2 className="mt-1 font-serif text-xl leading-snug">{feast.title}</h2>
        {feast.dateLabel ? <p className="mt-1 text-sm text-white/80">{feast.dateLabel}</p> : null}
        <Button href="/festa-da-padroeira" variant="gold" size="sm" className="mt-3">
          Ver programação
        </Button>
      </div>
    </article>
  )
}
