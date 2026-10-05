import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import { mediaUrl } from '@/lib/api-client'
import { getErrorMessage } from '@/lib/api-error'
import { STALE_TIME } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { feastDescriptionLines } from '@/services/feast'
import { getFeast } from '@/services/parishService'
import type { FeastProgramItem } from '@/types'
import { formatShortDate } from '@/utils/dates'

const PROGRAM_LABELS: Record<FeastProgramItem['type'], string> = {
  novena: 'Novena',
  missa: 'Missa',
  procissao: 'Procissão',
  evento: 'Evento',
  show: 'Show',
  quermesse: 'Quermesse',
}

export function FeastPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.feast,
    queryFn: getFeast,
    staleTime: STALE_TIME.settings,
  })

  usePageMeta(
    data?.title ? `${data.title} | Paróquia Nossa Senhora das Graças` : 'Festa da Padroeira',
    data?.description,
  )

  const lines = feastDescriptionLines(data?.description ?? '')
  const image = mediaUrl(data?.image)

  return (
    <div>
      <PageHeader
        eyebrow="Padroeira"
        title={data?.title || 'Festa da Padroeira'}
        description={data?.dateLabel || undefined}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        {isLoading && !data ? <Skeleton className="h-72" /> : null}
        {error ? <ErrorState message={getErrorMessage(error, 'Não foi possível carregar a festa.')} /> : null}
        {data ? (
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-10">
              {lines.some((line) => line.trim() !== '') ? (
                <div className="space-y-3 text-base leading-relaxed text-navy/90">
                  {lines.map((line, index) =>
                    line.trim() === '' ? (
                      <div key={index} className="h-2" aria-hidden />
                    ) : (
                      <p key={index}>{line}</p>
                    ),
                  )}
                </div>
              ) : null}
              <section>
                <h2 className="font-serif text-2xl text-navy">Programação</h2>
                {data.program.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">A programação será publicada em breve.</p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {data.program.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-line bg-white p-4">
                        <p className="text-xs font-semibold tracking-wide text-gold-dark uppercase">
                          {PROGRAM_LABELS[item.type]}
                          {item.date ? ` · ${formatShortDate(item.date)}` : ''}
                          {item.time ? ` · ${item.time}` : ''}
                        </p>
                        <p className="mt-1 font-medium text-navy">{item.title}</p>
                        {item.description ? (
                          <div className="mt-2 space-y-1 text-sm leading-relaxed text-muted">
                            {feastDescriptionLines(item.description).map((line, index) =>
                              line.trim() === '' ? (
                                <div key={index} className="h-1" aria-hidden />
                              ) : (
                                <p key={index}>{line}</p>
                              ),
                            )}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
            {image ? (
              <img
                src={image}
                alt=""
                className="aspect-[4/5] w-full rounded-2xl object-cover shadow-sm lg:sticky lg:top-6"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
