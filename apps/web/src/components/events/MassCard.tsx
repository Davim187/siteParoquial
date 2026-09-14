import { MapPin, User } from 'lucide-react'
import type { Mass } from '@/types'
import { formatDate, isSameDay, parseDate, weekdayName } from '@/utils/dates'
import { cn } from '@/utils/cn'

function massDayFlags(date: string, time: string) {
  const occurs = parseDate(date, time)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    isToday: isSameDay(occurs, now),
    isTomorrow: isSameDay(occurs, tomorrow),
  }
}

export function MassCard({ mass }: { mass: Mass }) {
  const { isToday, isTomorrow } = massDayFlags(mass.date, mass.time)
  const badge = isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : mass.isNext ? 'Próxima celebração' : null
  const weekday = weekdayName(mass.date)
  const showNotes =
    mass.notes &&
    mass.notes.toLowerCase() !== weekday.toLowerCase() &&
    !['domingo', 'sexta-feira', 'sábado'].includes(mass.notes.toLowerCase())

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">{weekday}</p>
        {badge ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              isToday ? 'bg-marian text-white' : 'bg-gold/20 text-gold-dark',
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <p className="mt-3 font-serif text-3xl text-navy">{formatDate(mass.date)}</p>
      <p className="mt-4 text-lg font-semibold text-marian">{mass.time}</p>
      <h3 className="mt-1 font-serif text-xl text-navy">{mass.type}</h3>
      {mass.celebrant ? (
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-navy">
          <User size={16} className="text-gold-dark" />
          {mass.celebrant}
        </p>
      ) : null}
      <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
        <MapPin size={16} />
        {mass.location}
      </p>
      {showNotes ? <p className="mt-3 text-xs text-muted">{mass.notes}</p> : null}
    </article>
  )
}
