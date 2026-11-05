import { PastoralCard } from '@/components/pastorals/PastoralCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorState, EmptyState, SkeletonGrid } from '@/components/ui/Feedback'
import { usePastoralsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'
import { pastoralKindLabels, pastoralKindOrder } from '@/utils/labels'

export function PastoralsPage() {
  usePageMeta(
    'Pastorais e movimentos | Paróquia Nossa Senhora das Graças',
    'Conheça as pastorais, os movimentos e as comissões da Paróquia Nossa Senhora das Graças.',
  )
  const { data, isLoading, error, isFetching } = usePastoralsQuery()
  const showSkeleton = isLoading && !data
  const groups = pastoralKindOrder
    .map((kind) => ({
      kind,
      title: pastoralKindLabels[kind].plural,
      items: data?.filter((item) => (item.kind ?? 'pastoral') === kind) ?? [],
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div>
      <PageHeader
        eyebrow="Serviço"
        title="Pastorais e movimentos"
        description="Pastorais, movimentos e comissões da comunidade, cada grupo no seu lugar."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {error && !data ? <ErrorState message={getErrorMessage(error)} /> : null}
        {showSkeleton ? <SkeletonGrid count={6} className="h-56" /> : null}
        {!showSkeleton && data?.length === 0 ? (
          <EmptyState title="Nenhum grupo cadastrado" />
        ) : null}
        {groups.length ? (
          <div className="space-y-12">
            {isFetching && !isLoading ? (
              <p className="text-xs text-muted">Atualizando...</p>
            ) : null}
            {groups.map((group) => (
              <section key={group.kind} className="border-t border-line pt-8 first:border-t-0 first:pt-0">
                <h2 className="font-serif text-2xl text-navy">{group.title}</h2>
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((pastoral) => (
                    <PastoralCard key={pastoral.id} pastoral={pastoral} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
