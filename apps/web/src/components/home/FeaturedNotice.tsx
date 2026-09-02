import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Notice } from '@/types'
import { noticeLabels } from '@/utils/labels'
import { formatDate } from '@/utils/dates'
import { cn } from '@/utils/cn'

function FeaturedNoticeCard({
  notice,
  prominent = false,
}: {
  notice: Notice
  prominent?: boolean
}) {
  return (
    <article
      className={cn(
        'flex h-full flex-col gap-4 rounded-2xl border border-gold/30 bg-white p-5 shadow-xl md:p-6',
        prominent ? 'md:flex-row md:items-center md:justify-between' : '',
      )}
    >
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
          <Bell size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
            {notice.category === 'urgente' ? 'Aviso urgente' : 'Aviso importante'}
          </p>
          <h2 className={cn('mt-1 font-serif text-navy', prominent ? 'text-2xl' : 'text-xl')}>
            {notice.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{notice.description}</p>
          <p className="mt-2 text-xs text-muted">
            {noticeLabels[notice.category]} · {formatDate(notice.date)}
          </p>
        </div>
      </div>
      {prominent ? (
        <Button href="/avisos" variant="outline" className="shrink-0 self-start md:self-center">
          Ver todos os avisos
        </Button>
      ) : null}
    </article>
  )
}

export function FeaturedNotice({ notices }: { notices?: Notice[] }) {
  if (!notices?.length) return null

  if (notices.length === 1) {
    return (
      <section className="relative z-10 -mt-8 px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <FeaturedNoticeCard notice={notices[0]} prominent />
        </div>
      </section>
    )
  }

  return (
    <section className="relative z-10 -mt-8 px-4 md:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
          Avisos em destaque
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {notices.map((notice) => (
            <FeaturedNoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
        <div className="flex justify-center pt-1">
          <Button href="/avisos" variant="outline">
            Ver todos os avisos
          </Button>
        </div>
      </div>
    </section>
  )
}
