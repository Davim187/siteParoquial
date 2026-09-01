import { SacramentCard } from '@/components/sacraments/SacramentCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { listSacraments } from '@/services/sacramentService'

export function SacramentsPage() {
  usePageMeta('Sacramentos | Paróquia Nossa Senhora das Graças')
  const { data, loading, error } = useAsync(() => listSacraments(), [])

  return (
    <div>
      <PageHeader
        eyebrow="Vida sacramentária"
        title="Sacramentos"
        description="Conheça o caminho dos sacramentos e como solicitar o acompanhamento na secretaria."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {loading ? <Loading /> : null}
        {error ? <ErrorState message={error} /> : null}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((sacrament) => (
            <SacramentCard key={sacrament.id} sacrament={sacrament} />
          ))}
        </div>
      </div>
    </div>
  )
}
