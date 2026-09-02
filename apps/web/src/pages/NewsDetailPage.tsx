import { useState } from 'react'
import { Check, Link2, Share2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { NewsCard } from '@/components/news/NewsCard'
import { Badge, PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { useQuery } from '@tanstack/react-query'
import { useNewsDetailQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'
import { getRelatedNews } from '@/services/newsService'
import { queryKeys } from '@/lib/query-keys'
import { STALE_TIME } from '@/lib/query-client'
import { formatDate } from '@/utils/dates'

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  return ok
}

export function NewsDetailPage() {
  const { slug = '' } = useParams()
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const articleQuery = useNewsDetailQuery(slug)
  const relatedQuery = useQuery({
    queryKey: [...queryKeys.news.detail(slug), 'related'],
    queryFn: async () => {
      if (!articleQuery.data) return []
      return getRelatedNews(articleQuery.data)
    },
    enabled: Boolean(articleQuery.data),
    staleTime: STALE_TIME.news,
  })

  usePageMeta(
    articleQuery.data
      ? `${articleQuery.data.title} | Paróquia Nossa Senhora das Graças`
      : 'Notícia | Paróquia Nossa Senhora das Graças',
    articleQuery.data?.excerpt,
  )

  if (articleQuery.isLoading && !articleQuery.data) return <Loading />
  if (articleQuery.error) return <ErrorState message={getErrorMessage(articleQuery.error)} />
  if (!articleQuery.data) return <EmptyState title="Notícia não encontrada" />

  const article = articleQuery.data
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  async function handleCopyLink() {
    const ok = await copyToClipboard(shareUrl)
    if (ok) {
      setCopied(true)
      toast.push('Link copiado!')
      window.setTimeout(() => setCopied(false), 2000)
    } else {
      toast.push('Não foi possível copiar o link.', 'error')
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: shareUrl,
        })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }
    await handleCopyLink()
  }

  return (
    <div>
      <PageHeader eyebrow={article.category} title={article.title} description={article.subtitle}>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/75">
          <Badge tone="gold">{article.category}</Badge>
          <span>{article.author}</span>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
        </div>
      </PageHeader>
      <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <img src={article.image} alt="" className="mb-8 w-full rounded-2xl object-cover" />
        <div
          className="space-y-4 leading-relaxed text-ink [&_p]:text-muted"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        {article.gallery?.length ? (
          <div className="mt-10 grid grid-cols-2 gap-3">
            {article.gallery.map((src) => (
              <img key={src} src={src} alt="" className="h-40 w-full rounded-xl object-cover" loading="lazy" />
            ))}
          </div>
        ) : null}
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-navy hover:border-gold"
            onClick={() => void handleShare()}
          >
            <Share2 size={16} /> Compartilhar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm hover:border-gold"
            onClick={() => void handleCopyLink()}
          >
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>
        </div>
        <Link to="/noticias" className="mt-6 inline-block text-sm font-semibold text-marian">
          ← Voltar às notícias
        </Link>
      </article>
      {relatedQuery.data && relatedQuery.data.length > 0 ? (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="font-serif text-3xl text-navy">Notícias relacionadas</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {relatedQuery.data.map((item) => (
                <NewsCard key={item.id} article={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
