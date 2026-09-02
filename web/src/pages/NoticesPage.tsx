import { NoticeCard } from '@/components/notices/NoticeCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useNoticesQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'

export function NoticesPage() {
  usePageMeta('Avisos | Paróquia Nossa Senhora das Graças')
  const { data, isLoading, error } = useNoticesQuery()

  return (
    <div>
      <PageHeader
        eyebrow="Comunicados"
        title="Avisos"
        description="Informativos, urgentes, litúrgicos e comunicados da comunidade."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {isLoading && !data ? <Loading /> : null}
        {error ? <ErrorState message={getErrorMessage(error)} /> : null}
        {!isLoading && !error && data?.length === 0 ? <EmptyState title="Nenhum aviso no momento" /> : null}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      </div>
    </div>
  )
}
