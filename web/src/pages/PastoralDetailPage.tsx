import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { getPastoralBySlug } from '@/services/pastoralService'

export function PastoralDetailPage() {
  const { slug = '' } = useParams()
  const { data, loading, error } = useAsync(() => getPastoralBySlug(slug), [slug])
  usePageMeta(data ? `${data.name} | Pastorais` : 'Pastoral')

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} />
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
