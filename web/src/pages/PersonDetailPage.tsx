import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { getPersonBySlug } from '@/services/parishService'

export function PersonDetailPage({ forcedSlug }: { forcedSlug?: string }) {
  const params = useParams()
  const slug = forcedSlug ?? params.slug ?? ''
  const { data, loading, error } = useAsync(() => getPersonBySlug(slug), [slug])

  usePageMeta(
    data ? `${data.name} | Paróquia Nossa Senhora das Graças` : 'Pastores | Paróquia Nossa Senhora das Graças',
  )

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} />
  if (!data) return <EmptyState title="Perfil não encontrado" description="Volte à página institucional." />

  return (
    <div>
      <PageHeader eyebrow={data.role} title={data.name} />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[240px_1fr] md:px-6">
        <img
          src={data.photo}
          alt={`Foto de ${data.name}`}
          className="mx-auto h-56 w-56 rounded-full object-cover ring-4 ring-gold/30"
        />
        <div>
          <p className="leading-relaxed text-muted">{data.bio}</p>
          {data.quote ? <blockquote className="mt-6 border-l-4 border-gold pl-4 font-serif text-xl italic text-marian">“{data.quote}”</blockquote> : null}
          {data.ministry ? <p className="mt-4 text-sm text-muted"><strong>Atuação:</strong> {data.ministry}</p> : null}
          {data.attendance ? <p className="mt-2 text-sm text-muted"><strong>Atendimento:</strong> {data.attendance}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/contato" variant="outline">
              Falar com a secretaria
            </Button>
            <Link to="/nossa-paroquia" className="text-sm font-semibold text-marian self-center">
              Voltar para Nossa Paróquia
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
