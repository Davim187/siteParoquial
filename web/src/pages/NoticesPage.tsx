import { NoticeCard } from '@/components/notices/NoticeCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { listNotices } from '@/services/noticesService'

export function NoticesPage() {
  usePageMeta('Avisos | Paróquia Nossa Senhora das Graças')
  const { data, loading, error } = useAsync(() => listNotices(), [])

  return (
    <div>
      <PageHeader
        eyebrow="Comunicados"
        title="Avisos"
        description="Informativos, urgentes, litúrgicos e comunicados da comunidade."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {loading ? <Loading /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && data?.length === 0 ? <EmptyState title="Nenhum aviso no momento" /> : null}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      </div>
    </div>
  )
}
