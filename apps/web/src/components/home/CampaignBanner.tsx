import { Church } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { NewsArticle } from '@/types'

export function CampaignBanner({ article }: { article: NewsArticle }) {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:gap-6 md:px-6 md:py-6">
        {article.image ? (
          <img
            src={article.image}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-28 w-full shrink-0 rounded-xl object-cover md:h-[7.5rem] md:w-44"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            <Church size={14} /> Obra da paróquia
          </p>
          <h2 className="mt-1 font-serif text-xl leading-snug md:text-2xl">{article.title}</h2>
          <div className="mt-3 max-w-lg">
            <ProgressBar
              current={article.progressCurrent}
              goal={article.progressGoal}
              mode={article.progressMode}
              label={article.progressLabel || 'Arrecadação para o novo Centro Pastoral'}
              tone="dark"
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-stretch">
          <Button href="/dizimo" variant="gold" size="sm">
            Quero contribuir
          </Button>
          <Link
            to={`/noticias/${article.slug}`}
            className="inline-flex items-center justify-center rounded-lg border border-white/30 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Acompanhar a obra
          </Link>
        </div>
      </div>
    </section>
  )
}
