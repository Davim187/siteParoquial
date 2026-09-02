import { NewsCard } from '@/components/news/NewsCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useNewsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'

export function NewsPage() {
  usePageMeta('Notícias | Paróquia Nossa Senhora das Graças')
  const { data, isLoading, error } = useNewsQuery()

  return (
    <div>
      <PageHeader
        eyebrow="Comunicação"
        title="Notícias da Paróquia"
        description="Acompanhe a vida da comunidade. Conteúdos marcados como demonstrativos serão substituídos por publicações oficiais."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {isLoading && !data ? <Loading /> : null}
        {error ? <ErrorState message={getErrorMessage(error)} /> : null}
        {!isLoading && !error && data?.length === 0 ? (
          <EmptyState title="Nenhuma notícia publicada" />
        ) : null}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  )
}
