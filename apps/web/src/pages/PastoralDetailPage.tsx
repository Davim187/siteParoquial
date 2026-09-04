import { CalendarClock, MapPin, Phone, User } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { ProseHtml } from '@/components/ui/ProseHtml'
import { usePastoralDetailQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'
import { stripHtml } from '@/utils/html'
import { pastoralCover } from '@/constants/placeholders'

export function PastoralDetailPage() {
  const { slug = '' } = useParams()
  const { data, isLoading, error } = usePastoralDetailQuery(slug)
  usePageMeta(data ? `${data.name} | Pastorais` : 'Pastoral', data ? stripHtml(data.description) : undefined)

  if (isLoading && !data) return <Loading />
  if (error) return <ErrorState message={getErrorMessage(error)} />
  if (!data) return <EmptyState title="Pastoral não encontrada" />

  return (
    <div>
      <PageHeader eyebrow="Pastorais" title={data.name} />
      <div className="mx-auto max-w-5xl px-4 py-14 md:px-6">
        <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-start">
          <img src={pastoralCover(data.image)} alt="" className="h-80 w-full rounded-2xl object-cover" />
          <aside className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl text-navy">Informações</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2">
                <User size={16} className="mt-0.5 shrink-0 text-gold-dark" />
                <span>
                  <strong className="text-navy">Responsável:</strong> {data.responsible}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={16} className="mt-0.5 shrink-0 text-gold-dark" />
                <span>
                  <strong className="text-navy">Contato:</strong> {data.contact}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CalendarClock size={16} className="mt-0.5 shrink-0 text-gold-dark" />
                <span>
                  <strong className="text-navy">Reunião:</strong> {data.meetingTime}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold-dark" />
                <span>
                  <strong className="text-navy">Local:</strong> {data.location}
                </span>
              </li>
            </ul>
            <Button href="/participar" className="mt-6 w-full">
              Quero participar
            </Button>
          </aside>
        </div>
        <div className="mt-10 rounded-2xl border border-line bg-white p-6 md:p-8">
          <ProseHtml html={data.description} />
        </div>
        <Link to="/pastorais" className="mt-8 inline-block font-semibold text-marian">
          ← Todas as pastorais
        </Link>
      </div>
    </div>
  )
}
