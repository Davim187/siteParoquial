import { PastoralCard } from '@/components/pastorals/PastoralCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { listPastorals } from '@/services/pastoralService'

export function PastoralsPage() {
  usePageMeta('Pastorais | Paróquia Nossa Senhora das Graças')
  const { data, loading, error } = useAsync(() => listPastorals(), [])

  return (
    <div>
      <PageHeader
        eyebrow="Serviço"
        title="Pastorais e movimentos"
        description="Exemplos cadastrados para demonstração. O administrador pode adicionar ou remover pastorais no painel."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {loading ? <Loading /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && data?.length === 0 ? (
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
