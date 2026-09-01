import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { getSacramentBySlug } from '@/services/sacramentService'

export function SacramentDetailPage() {
  const { slug = '' } = useParams()
  const { data, loading, error } = useAsync(() => getSacramentBySlug(slug), [slug])
  usePageMeta(data ? `${data.name} | Sacramentos` : 'Sacramento')

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} />
  if (!data) return <EmptyState title="Sacramento não encontrado" />

  return (
    <div>
      <PageHeader title={data.name} description={data.summary} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-14 md:px-6">
        <section>
          <h2 className="font-serif text-2xl text-navy">O que é</h2>
          <p className="mt-2 text-muted">{data.whatItIs}</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-navy">Quem pode receber</h2>
          <p className="mt-2 text-muted">{data.whoCanReceive}</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-navy">Como funciona</h2>
          <p className="mt-2 text-muted">{data.howItWorks}</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-navy">Documentos necessários</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {data.documents.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-navy">Como realizar a inscrição</h2>
          <p className="mt-2 text-muted">{data.howToRegister}</p>
          <p className="mt-2 text-sm text-muted">Contato da secretaria: {data.secretaryContact}</p>
        </section>
        <div className="flex flex-wrap gap-3">
          <Button href="/contato">Quero saber mais</Button>
          <Link to="/sacramentos" className="self-center text-sm font-semibold text-marian">
            ← Todos os sacramentos
          </Link>
        </div>
      </div>
    </div>
  )
}
