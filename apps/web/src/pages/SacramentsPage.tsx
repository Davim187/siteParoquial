import { SacramentCard } from '@/components/sacraments/SacramentCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorState, EmptyState, SkeletonGrid } from '@/components/ui/Feedback'
import { useSacramentsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'

export function SacramentsPage() {
  usePageMeta(
    'Sacramentos | Paróquia Nossa Senhora das Graças',
    'Informações sobre os sacramentos celebrados na Paróquia Nossa Senhora das Graças.',
  )
  const { data, isLoading, error } = useSacramentsQuery()
  const showSkeleton = isLoading && !data

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Vida sacramentária"
        title="Sacramentos"
        description="Conheça cada sacramento, quem pode recebê-lo e como iniciar o processo na nossa paróquia."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {error && !data ? <ErrorState message={getErrorMessage(error)} /> : null}
        {showSkeleton ? <SkeletonGrid count={6} className="h-44" /> : null}
        {!showSkeleton && !error && data?.length === 0 ? (
          <EmptyState
            title="Nenhum sacramento publicado"
            description="Os sacramentos serão exibidos aqui assim que forem cadastrados."
          />
        ) : null}
        {data?.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((sacrament) => (
              <SacramentCard key={sacrament.id} sacrament={sacrament} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
