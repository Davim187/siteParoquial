import { SacramentCard } from '@/components/sacraments/SacramentCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { useSacramentsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'

export function SacramentsPage() {
  usePageMeta('Sacramentos | Paróquia Nossa Senhora das Graças')
  const { data, isLoading, error } = useSacramentsQuery()

  return (
    <div>
      <PageHeader
        eyebrow="Vida sacramentária"
        title="Sacramentos"
        description="Conheça o caminho dos sacramentos e como solicitar o acompanhamento na secretaria."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {isLoading && !data ? <Loading /> : null}
        {error ? <ErrorState message={getErrorMessage(error)} /> : null}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((sacrament) => (
            <SacramentCard key={sacrament.id} sacrament={sacrament} />
          ))}
        </div>
      </div>
    </div>
  )
}
