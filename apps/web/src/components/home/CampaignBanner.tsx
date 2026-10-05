import { Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { NewsArticle } from '@/types'

export function CampaignBanner({ article }: { article: NewsArticle }) {
  const isFundraising = article.progressMode !== 'percent'
  const badge = article.progressBadge?.trim() || 'Em destaque'
  const progressLabel = article.progressLabel?.trim() || 'Progresso'

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-navy text-white shadow-sm sm:flex-row sm:items-center">
      {article.image ? (
        <img
          src={article.image}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="h-36 w-full shrink-0 object-cover sm:h-auto sm:w-44"
        />
      ) : null}
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
          <Megaphone size={14} /> {badge}
        </p>
        <h2 className="mt-1 font-serif text-xl leading-snug">{article.title}</h2>
        <div className="mt-3 max-w-md">
          <ProgressBar
            current={article.progressCurrent}
            goal={article.progressGoal}
            mode={article.progressMode}
            label={progressLabel}
            tone="dark"
          />
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 px-4 pb-4 sm:px-0 sm:py-5 sm:pr-5">
        {isFundraising ? (
          <Button href="/dizimo" variant="gold" size="sm">
            Quero contribuir
          </Button>
        ) : null}
        <Link
          to={`/noticias/${article.slug}`}
          className="inline-flex items-center justify-center rounded-lg border border-white/35 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-white/10"
        >
          Saiba mais
        </Link>
      </div>
    </article>
  )
}
