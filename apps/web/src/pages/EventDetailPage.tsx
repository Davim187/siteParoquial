import { useState } from 'react'
import { Clock, MapPin, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge, PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { useEventDetailQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'
import { formatDate } from '@/utils/dates'
import { eventLabels } from '@/utils/labels'

export function EventDetailPage() {
  const { slug = '' } = useParams()
  const { data, isLoading, error } = useEventDetailQuery(slug)
  const [lightbox, setLightbox] = useState<string | null>(null)

  usePageMeta(
    data ? `${data.title} | Agenda` : 'Evento | Paróquia Nossa Senhora das Graças',
    data?.description,
  )

  if (isLoading && !data) return <Loading />
  if (error) return <ErrorState message={getErrorMessage(error)} />
  if (!data) return <EmptyState title="Evento não encontrado" />

  const gallery = data.gallery ?? []

  return (
    <div>
      <PageHeader eyebrow="Agenda" title={data.title}>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/75">
          <Badge tone="gold">{eventLabels[data.category]}</Badge>
          <time dateTime={data.date}>{formatDate(data.date)}</time>
        </div>
      </PageHeader>
      <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        {data.image ? (
          <img src={data.image} alt="" className="mb-8 w-full rounded-2xl object-cover" />
        ) : null}
        <div className="mb-8 space-y-2 text-sm text-navy">
          <p className="inline-flex items-center gap-2">
            <Clock size={16} className="text-gold-dark" />
            {data.time}
            {data.endTime ? ` – ${data.endTime}` : ''}
          </p>
          <p className="flex items-center gap-2">
            <MapPin size={16} className="text-gold-dark" />
            {data.location}
          </p>
          {data.responsible ? <p>Responsável: {data.responsible}</p> : null}
        </div>
        <div className="whitespace-pre-wrap text-base leading-relaxed text-muted">{data.description}</div>
        {gallery.length ? (
          <div className="mt-10">
            <h2 className="mb-4 font-serif text-2xl text-navy">Fotos</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {gallery.map((src) => (
                <button
                  key={src}
                  type="button"
                  className="overflow-hidden rounded-xl"
                  onClick={() => setLightbox(src)}
                >
                  <img src={src} alt="" className="h-40 w-full object-cover transition hover:scale-105" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <Link to="/agenda" className="mt-10 inline-block text-sm font-semibold text-marian">
          ← Voltar à agenda
        </Link>
      </article>
      {lightbox ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-deep/80 p-4" onClick={() => setLightbox(null)}>
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-navy"
            aria-label="Fechar imagem"
            onClick={() => setLightbox(null)}
          >
            <X size={18} />
          </button>
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </div>
  )
}
