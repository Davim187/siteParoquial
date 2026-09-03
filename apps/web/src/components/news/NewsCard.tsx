import { Link } from 'react-router-dom'
import type { NewsArticle } from '@/types'
import { formatDate } from '@/utils/dates'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/utils/cn'

export function NewsCard({
  article,
  featured = false,
}: {
  article: NewsArticle
  featured?: boolean
}) {
  const isFeatured = featured || article.featured

  return (
    <Card
      className={cn(
        'group flex h-full flex-col',
        isFeatured && 'border-gold/40 shadow-[0_12px_32px_rgba(26,54,93,0.12)] md:flex-row',
      )}
    >
      <div className={cn('overflow-hidden', isFeatured && 'md:w-[52%] md:shrink-0')}>
        <img
          src={article.image}
          alt=""
          className={cn(
            'w-full object-cover transition duration-500 group-hover:scale-105',
            isFeatured ? 'h-64 md:h-full md:min-h-[320px]' : 'h-48',
          )}
          loading="lazy"
        />
      </div>
      <div className={cn('flex flex-1 flex-col p-5', isFeatured && 'md:p-8')}>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {isFeatured ? <Badge tone="gold">Destaque</Badge> : null}
          <Badge>{article.category}</Badge>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
        </div>
        <h3
          className={cn(
            'mt-3 font-serif leading-snug text-navy transition group-hover:text-marian',
            isFeatured ? 'text-3xl md:text-4xl' : 'text-2xl',
          )}
        >
          {article.title}
        </h3>
        {isFeatured && article.subtitle ? (
          <p className="mt-2 text-base text-navy/70">{article.subtitle}</p>
        ) : null}
        <p className={cn('mt-2 flex-1 leading-relaxed text-muted', isFeatured ? 'text-base' : 'text-sm')}>
          {article.excerpt}
        </p>
        {article.showProgress ? (
          <div className="mt-4">
            <ProgressBar
              current={article.progressCurrent}
              goal={article.progressGoal}
              label={article.progressLabel}
            />
          </div>
        ) : null}
        <Link
          to={`/noticias/${article.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-marian transition hover:gap-2 hover:text-gold-dark"
        >
          Leia mais <span aria-hidden>→</span>
        </Link>
      </div>
    </Card>
  )
}
