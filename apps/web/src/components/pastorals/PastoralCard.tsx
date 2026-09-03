import { User } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Pastoral } from '@/types'
import { Card } from '@/components/ui/Card'
import { stripHtml } from '@/utils/html'

export function PastoralCard({ pastoral }: { pastoral: Pastoral }) {
  const summary = stripHtml(pastoral.description)

  return (
    <Card className="flex h-full flex-col">
      <img src={pastoral.image} alt="" className="h-40 w-full object-cover" loading="lazy" />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-2xl text-navy">{pastoral.name}</h3>
        {summary ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{summary}</p> : null}
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
