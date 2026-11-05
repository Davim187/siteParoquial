import { User } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Pastoral } from '@/types'
import { Card } from '@/components/ui/Card'
import { ProseHtml } from '@/components/ui/ProseHtml'
import { pastoralCover } from '@/constants/placeholders'
import { pastoralKindLabels } from '@/utils/labels'

export function PastoralCard({ pastoral }: { pastoral: Pastoral }) {
  return (
    <Card className="flex h-full flex-col">
      <img
        src={pastoralCover(pastoral.image)}
        alt=""
        className="h-40 w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-dark uppercase">
          {pastoralKindLabels[pastoral.kind ?? 'pastoral'].singular}
        </p>
        <h3 className="mt-1 font-serif text-2xl text-navy">{pastoral.name}</h3>
        {pastoral.description?.trim() ? (
          <div className="mt-2 line-clamp-4">
            <ProseHtml compact html={pastoral.description} />
          </div>
        ) : null}
        <p className="mt-3 flex items-center gap-2 text-sm text-ink">
          <User size={15} className="text-gold-dark" /> {pastoral.responsible}
        </p>
        <Link to={`/pastorais/${pastoral.slug}`} className="mt-4 font-semibold text-marian">
          Saiba mais
        </Link>
      </div>
    </Card>
  )
}
