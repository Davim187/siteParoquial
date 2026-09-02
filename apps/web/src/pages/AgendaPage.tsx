import { useMemo, useState } from 'react'
import { Calendar } from '@/components/events/Calendar'
import { EventCard } from '@/components/events/EventCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { useEventsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { EventCategory } from '@/types'
import { eventLabels } from '@/utils/labels'
import { cn } from '@/utils/cn'

const filters: Array<EventCategory | 'todos'> = [
  'todos',
  'missa',
  'adoracao',
  'confissao',
  'evento',
  'reuniao',
  'pastoral',
  'formacao',
  'festa',
  'celebracao-especial',
]

export function AgendaPage() {
  usePageMeta('Agenda | Paróquia Nossa Senhora das Graças')
  const [category, setCategory] = useState<EventCategory | 'todos'>('todos')
  const [view, setView] = useState<'lista' | 'calendario'>('lista')
  const { data, isLoading, error } = useEventsQuery(category)
  const allForCalendar = useEventsQuery('todos')
  const calendarEvents = useMemo(() => allForCalendar.data ?? [], [allForCalendar.data])

  return (
    <div>
      <PageHeader
        eyebrow="Comunidade"
        title="Agenda paroquial"
        description="Missas, adoração, confissões, eventos, reuniões, pastorais e celebrações especiais."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition',
                category === item
                  ? 'border-marian bg-marian text-white'
                  : 'border-line bg-white text-navy hover:border-gold',
              )}
            >
              {item === 'todos' ? 'Todos' : eventLabels[item]}
            </button>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className={cn('rounded-full px-4 py-2 text-sm', view === 'lista' ? 'bg-navy text-white' : 'bg-white border border-line')}
            onClick={() => setView('lista')}
          >
            Lista de eventos
          </button>
          <button
            type="button"
            className={cn('rounded-full px-4 py-2 text-sm', view === 'calendario' ? 'bg-navy text-white' : 'bg-white border border-line')}
            onClick={() => setView('calendario')}
          >
            Calendário mensal
          </button>
        </div>
        <div className="mt-8">
          {view === 'calendario' ? (
            allForCalendar.isLoading && !calendarEvents.length ? (
              <Loading />
            ) : (
              <Calendar events={calendarEvents} />
            )
          ) : (
            <>
              {isLoading && !data ? <Loading /> : null}
              {error ? <ErrorState message={getErrorMessage(error)} /> : null}
              {!isLoading && data?.length === 0 ? (
                <EmptyState title="Nenhum evento nesta categoria" />
              ) : null}
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {data?.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
