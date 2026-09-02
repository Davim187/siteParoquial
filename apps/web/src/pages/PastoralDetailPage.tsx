import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { usePastoralDetailQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'

export function PastoralDetailPage() {
  const { slug = '' } = useParams()
  const { data, isLoading, error } = usePastoralDetailQuery(slug)
  usePageMeta(data ? `${data.name} | Pastorais` : 'Pastoral')

  if (isLoading && !data) return <Loading />
  if (error) return <ErrorState message={getErrorMessage(error)} />
  if (!data) return <EmptyState title="Pastoral não encontrada" />

  return (
    <div>
      <PageHeader title={data.name} description={data.description} />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-2 md:px-6">
        <img src={data.image} alt="" className="h-80 w-full rounded-2xl object-cover" />
        <div className="space-y-3 text-sm text-muted">
          <p><strong className="text-navy">Responsável:</strong> {data.responsible}</p>
          <p><strong className="text-navy">Contato:</strong> {data.contact}</p>
          <p><strong className="text-navy">Reunião:</strong> {data.meetingTime}</p>
          <p><strong className="text-navy">Local:</strong> {data.location}</p>
          <Button href="/participar" className="mt-4">
            Quero participar
          </Button>
          <div>
            <Link to="/pastorais" className="text-marian font-semibold">
              ← Todas as pastorais
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
