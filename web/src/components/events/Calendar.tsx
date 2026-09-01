import type { ParishEvent } from '@/types'
import { eventLabels } from '@/utils/labels'
import { toISODate } from '@/utils/dates'
import { cn } from '@/utils/cn'
import { useMemo, useState } from 'react'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function Calendar({ events }: { events: ParishEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const blanks = Array.from({ length: firstWeekday }, () => null)
    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1)
    return [...blanks, ...days]
  }, [cursor])

  const byDay = useMemo(() => {
    const map = new Map<string, ParishEvent[]>()
    for (const event of events) {
      const list = map.get(event.date) ?? []
      list.push(event)
      map.set(event.date, list)
    }
    return map
  }, [events])

  const label = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-full border border-line px-3 py-1 text-sm hover:border-gold"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          Mês anterior
        </button>
        <h3 className="font-serif text-xl capitalize text-navy">{label}</h3>
        <button
          type="button"
          className="rounded-full border border-line px-3 py-1 text-sm hover:border-gold"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          Próximo mês
        </button>
      </div>
      <div className="grid min-w-[640px] grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="min-h-24 rounded-lg bg-cream/50" />
          const iso = toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), day))
          const dayEvents = byDay.get(iso) ?? []
          const isToday = iso === toISODate(new Date())
          return (
            <div
              key={iso}
              className={cn(
                'min-h-24 rounded-lg border border-transparent p-1 text-left',
                isToday && 'border-gold bg-gold/10',
              )}
            >
              <p className="text-sm font-semibold text-navy">{day}</p>
              <ul className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <li key={event.id} className="truncate rounded bg-marian/10 px-1 py-0.5 text-[11px] text-marian">
                    {event.time} {event.title}
                  </li>
                ))}
                {dayEvents.length > 2 ? (
                  <li className="text-[11px] text-muted">+{dayEvents.length - 2} {eventLabels.evento}</li>
                ) : null}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
