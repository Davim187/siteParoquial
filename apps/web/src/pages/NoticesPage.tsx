import { NoticeCard } from '@/components/notices/NoticeCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorState, EmptyState, SkeletonGrid } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useNoticesQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'

export function NoticesPage() {
  usePageMeta(
    'Avisos | Paróquia Nossa Senhora das Graças',
    'Avisos e comunicados oficiais da Paróquia Nossa Senhora das Graças.',
  )
  const { data, isLoading, error, isFetching } = useNoticesQuery()
  const showSkeleton = isLoading && !data

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Comunicados"
        title="Avisos"
        description="Informativos, urgentes, litúrgicos e comunicados da comunidade."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {error && !data ? <ErrorState message={getErrorMessage(error)} /> : null}
        {showSkeleton ? <SkeletonGrid count={6} className="h-40" /> : null}
        {!showSkeleton && !error && data?.length === 0 ? (
          <EmptyState title="Nenhum aviso no momento" />
        ) : null}
        {data?.length ? (
          <>
            {isFetching && !isLoading ? (
              <p className="mb-4 text-xs text-muted">Atualizando avisos...</p>
            ) : null}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
