import { CampaignBanner } from '@/components/home/CampaignBanner'
import { NewsCard } from '@/components/news/NewsCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useCampaignNewsQuery, useNewsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'

export function NewsPage() {
  usePageMeta('Notícias | Paróquia Nossa Senhora das Graças')
  const { data, isLoading, error } = useNewsQuery()
  const campaignQuery = useCampaignNewsQuery()
  const campaign = campaignQuery.data ?? undefined
  const featured = data?.find((article) => article.featured && article.id !== campaign?.id)
  const others = data?.filter((article) => article.id !== featured?.id && article.id !== campaign?.id) ?? []

  return (
    <div>
      <PageHeader
        eyebrow="Comunicação"
        title="Notícias da Paróquia"
        description="Acompanhe a vida da comunidade. Conteúdos marcados como demonstrativos serão substituídos por publicações oficiais."
      />
      {campaign ? <CampaignBanner article={campaign} /> : null}
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {isLoading && !data ? <Loading /> : null}
        {error ? <ErrorState message={getErrorMessage(error)} /> : null}
        {!isLoading && !error && data?.length === 0 ? (
          <EmptyState title="Nenhuma notícia publicada" />
        ) : null}
        {data?.length ? (
          <div className="space-y-6">
            {featured ? <NewsCard article={featured} featured /> : null}
            {others.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
