import { Link } from 'react-router-dom'
import type { NewsArticle } from '@/types'
import { formatDate } from '@/utils/dates'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/PageHeader'

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <Card className="group flex h-full flex-col">
      <div className="overflow-hidden">
        <img
          src={article.image}
          alt=""
          className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge>{article.category}</Badge>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
        </div>
        <h3 className="mt-3 font-serif text-2xl leading-snug text-navy transition group-hover:text-marian">
          {article.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{article.excerpt}</p>
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
