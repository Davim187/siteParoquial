import { Button } from '@/components/ui/Button'
import type { PatronFeast } from '@/types'
import { formatDate } from '@/utils/dates'

export function PatronFeastBanner({ feast }: { feast: PatronFeast }) {
  if (!feast.enabled) return null
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1.2fr_1fr] md:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Padroeira</p>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl">{feast.title}</h2>
          <p className="mt-2 text-gold">{feast.dateLabel}</p>
          <p className="mt-4 max-w-xl text-white/80">{feast.description}</p>
          <Button href="/nossa-paroquia#padroeira" variant="gold" className="mt-6">
            Ver programação
          </Button>
        </div>
        <ol className="space-y-3">
          {feast.program.slice(0, 4).map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-gold">
                {formatDate(item.date)} · {item.time}
              </p>
              <p className="mt-1 font-medium">{item.title}</p>
              <p className="text-sm text-white/70">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
