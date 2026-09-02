import { PastoralCard } from '@/components/pastorals/PastoralCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { usePastoralsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'

export function PastoralsPage() {
  usePageMeta('Pastorais | Paróquia Nossa Senhora das Graças')
  const { data, isLoading, error } = usePastoralsQuery()

  return (
    <div>
      <PageHeader
        eyebrow="Serviço"
        title="Pastorais e movimentos"
        description="Exemplos cadastrados para demonstração. O administrador pode adicionar ou remover pastorais no painel."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {isLoading && !data ? <Loading /> : null}
        {error ? <ErrorState message={getErrorMessage(error)} /> : null}
        {!isLoading && data?.length === 0 ? (
          <EmptyState title="Nenhuma pastoral cadastrada" />
        ) : null}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((pastoral) => (
            <PastoralCard key={pastoral.id} pastoral={pastoral} />
          ))}
        </div>
      </div>
    </div>
  )
}
