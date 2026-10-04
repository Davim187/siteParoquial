import { PageHeader } from '@/components/ui/PageHeader'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { useSettingsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'
import { PLACEHOLDER_IMAGES } from '@/constants/placeholders'
import { mediaUrl } from '@/lib/api-client'

export function ParishPage() {
  usePageMeta(
    'Nossa Paróquia | Paróquia Nossa Senhora das Graças',
    'Conheça a história, a missão e a padroeira da Paróquia Nossa Senhora das Graças.',
  )
  const { data, isLoading, error } = useSettingsQuery()

  if (error && !data) return <ErrorState message={getErrorMessage(error, 'Erro ao carregar')} />

  if (isLoading && !data) {
    return (
      <div>
        <PageHeader eyebrow="Institucional" title="Nossa Paróquia" description="Carregando informações..." />
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-14 md:px-6">
          <Skeleton className="h-40" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  if (!data) return <ErrorState message="Configurações não encontradas." />

  return (
    <div>
      <PageHeader
        eyebrow="Institucional"
        title="Nossa Paróquia"
        description="Conheça a história, a missão e a padroeira desta comunidade de fé."
      />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 md:px-6">
        <section>
          <SectionTitle title="Nossa história" />
          <p className="mt-5 max-w-3xl leading-relaxed text-muted">{data.history}</p>
        </section>
        <section id="missao" className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6">
            <SectionTitle title="Nossa missão" />
            <p className="mt-4 leading-relaxed text-muted">{data.mission}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6">
            <SectionTitle title="Nossa visão" />
            <p className="mt-4 leading-relaxed text-muted">{data.vision}</p>
          </div>
        </section>
        <section id="padroeira" className="grid items-center gap-8 lg:grid-cols-2">
          <img
            src={mediaUrl(data.patroness?.image) || PLACEHOLDER_IMAGES.mary}
            alt={data.patroness.name}
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lg"
            loading="lazy"
          />
          <div>
            <SectionTitle eyebrow="Padroeira" title={data.patroness.name} />
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
              <p>{data.patroness.history}</p>
              <p>{data.patroness.devotion}</p>
              <p>{data.patroness.medal}</p>
              <p>{data.patroness.feast}</p>
              <p>{data.patroness.traditions}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
