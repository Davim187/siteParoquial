import { Clock, MapPin } from 'lucide-react'
import type { ParishEvent } from '@/types'
import { eventLabels } from '@/utils/labels'
import { formatDate } from '@/utils/dates'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/PageHeader'

export function EventCard({ event }: { event: ParishEvent }) {
  return (
    <Card className="group overflow-hidden p-0">
      {event.image ? (
        <div className="overflow-hidden">
          <img
            src={event.image}
            alt=""
            className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="p-5">
        <Badge>{eventLabels[event.category]}</Badge>
        <h3 className="mt-3 font-serif text-xl text-navy transition group-hover:text-marian">{event.title}</h3>
        <p className="mt-2 text-sm text-muted">{formatDate(event.date)}</p>
        <div className="mt-3 flex flex-col gap-1 text-sm text-ink">
          <p className="inline-flex items-center gap-2">
            <Clock size={16} className="text-gold-dark" />
            {event.time}
            {event.endTime ? ` – ${event.endTime}` : ''}
          </p>
          <p className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-gold-dark" />
            {event.location}
          </p>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{event.description}</p>
        {event.responsible ? <p className="mt-2 text-xs text-muted">Responsável: {event.responsible}</p> : null}
      </div>
    </Card>
  )
}
