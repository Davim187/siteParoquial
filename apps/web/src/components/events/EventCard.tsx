import { Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ParishEvent } from '@/types'
import { eventLabels } from '@/utils/labels'
import { formatDate } from '@/utils/dates'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/PageHeader'

export function EventCard({ event }: { event: ParishEvent }) {
  const href = `/agenda/${event.slug || event.id}`

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0">
      {event.image ? (
        <Link to={href} className="overflow-hidden">
          <img
            src={event.image}
            alt=""
            className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </Link>
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        <Badge>{eventLabels[event.category]}</Badge>
        <h3 className="mt-3 font-serif text-xl text-navy transition group-hover:text-marian">
          <Link to={href}>{event.title}</Link>
        </h3>
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
        {event.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{event.description}</p>
        ) : null}
        {event.responsible ? <p className="mt-2 text-xs text-muted">Responsável: {event.responsible}</p> : null}
        <Link to={href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-marian transition hover:gap-2 hover:text-gold-dark">
          Saiba mais <span aria-hidden>→</span>
        </Link>
      </div>
    </Card>
  )
}
