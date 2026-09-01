import { NewsCard } from '@/components/news/NewsCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { listNews } from '@/services/newsService'

export function NewsPage() {
  usePageMeta('Notícias | Paróquia Nossa Senhora das Graças')
  const { data, loading, error } = useAsync(() => listNews(), [])

  return (
    <div>
      <PageHeader
        eyebrow="Comunicação"
        title="Notícias da Paróquia"
        description="Acompanhe a vida da comunidade. Conteúdos marcados como demonstrativos serão substituídos por publicações oficiais."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {loading ? <Loading /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && data?.length === 0 ? (
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
