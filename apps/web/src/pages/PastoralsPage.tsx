import { PastoralCard } from '@/components/pastorals/PastoralCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorState, EmptyState, SkeletonGrid } from '@/components/ui/Feedback'
import { usePastoralsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'

export function PastoralsPage() {
  usePageMeta(
    'Pastorais | Paróquia Nossa Senhora das Graças',
    'Conheça as pastorais e movimentos da Paróquia Nossa Senhora das Graças.',
  )
  const { data, isLoading, error, isFetching } = usePastoralsQuery()
  const showSkeleton = isLoading && !data

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Serviço"
        title="Pastorais e movimentos"
        description="Exemplos cadastrados para demonstração. O administrador pode adicionar ou remover pastorais no painel."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {error && !data ? <ErrorState message={getErrorMessage(error)} /> : null}
        {showSkeleton ? <SkeletonGrid count={6} className="h-56" /> : null}
        {!showSkeleton && data?.length === 0 ? (
          <EmptyState title="Nenhuma pastoral cadastrada" />
        ) : null}
        {data?.length ? (
          <>
            {isFetching && !isLoading ? (
              <p className="mb-4 text-xs text-muted">Atualizando pastorais...</p>
            ) : null}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((pastoral) => (
                <PastoralCard key={pastoral.id} pastoral={pastoral} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
