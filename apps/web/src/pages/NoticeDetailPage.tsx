import { useState } from 'react'
import { X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge, PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { ShareButtons } from '@/components/ui/ShareButtons'
import { useNoticeDetailQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'
import { noticeLabels } from '@/utils/labels'
import { formatDate } from '@/utils/dates'

export function NoticeDetailPage() {
  const { id = '' } = useParams()
  const [zoomed, setZoomed] = useState(false)
  const noticeQuery = useNoticeDetailQuery(id)
  const notice = noticeQuery.data

  usePageMeta(
    notice ? `${notice.title} | Paróquia Nossa Senhora das Graças` : 'Aviso | Paróquia Nossa Senhora das Graças',
    notice?.description,
  )

  if (noticeQuery.isLoading && !notice) return <Loading />
  if (noticeQuery.error) return <ErrorState message={getErrorMessage(noticeQuery.error)} />
  if (!notice) return <EmptyState title="Aviso não encontrado" />

  const image = notice.imageFull || notice.image

  return (
    <div>
      <PageHeader eyebrow="Aviso" title={notice.title}>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/75">
          <Badge tone={notice.category === 'urgente' ? 'urgent' : 'gold'}>{noticeLabels[notice.category]}</Badge>
          <time dateTime={notice.date}>{formatDate(notice.date)}</time>
        </div>
      </PageHeader>
      <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        {image ? (
          <button
            type="button"
            className="mb-8 block w-full overflow-hidden rounded-2xl"
            aria-label="Ampliar imagem do aviso"
            onClick={() => setZoomed(true)}
          >
            <img src={image} alt={notice.title} className="w-full object-contain" />
          </button>
        ) : null}
        <p className="whitespace-pre-line text-lg leading-relaxed text-ink/85">{notice.description}</p>
        <ShareButtons title={notice.title} text={notice.description} className="mt-10 border-t border-line pt-6" />
        <Link to="/avisos" className="mt-6 inline-block text-sm font-semibold text-marian">
          ← Voltar aos avisos
        </Link>
      </article>
      {zoomed && image ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-deep/80 p-4" onClick={() => setZoomed(false)}>
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-navy"
            aria-label="Fechar imagem"
            onClick={() => setZoomed(false)}
          >
            <X size={20} />
          </button>
          <img
            src={image}
            alt=""
            className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  )
}
