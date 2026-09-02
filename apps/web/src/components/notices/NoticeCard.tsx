import type { Notice } from '@/types'
import { noticeLabels } from '@/utils/labels'
import { formatDate } from '@/utils/dates'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/PageHeader'

export function NoticeCard({ notice }: { notice: Notice }) {
  return (
    <Card className="p-5">
      {notice.image ? (
        <img src={notice.image} alt="" className="-mx-5 -mt-5 mb-4 h-36 w-[calc(100%+2.5rem)] object-cover" loading="lazy" />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={notice.category === 'urgente' ? 'urgent' : 'marian'}>{noticeLabels[notice.category]}</Badge>
        {notice.featured ? <Badge tone="gold">Destaque</Badge> : null}
      </div>
      <h3 className="mt-3 font-serif text-xl text-navy">{notice.title}</h3>
      <time className="mt-1 block text-sm text-muted" dateTime={notice.date}>
        {formatDate(notice.date)}
      </time>
      <p className="mt-3 text-sm leading-relaxed text-muted">{notice.description}</p>
    </Card>
  )
}
