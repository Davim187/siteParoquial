import { Clock, MapPin, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Pastoral } from '@/types'
import { Card } from '@/components/ui/Card'

export function PastoralCard({ pastoral }: { pastoral: Pastoral }) {
  return (
    <Card className="flex h-full flex-col">
      <img src={pastoral.image} alt="" className="h-40 w-full object-cover" loading="lazy" />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-2xl text-navy">{pastoral.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{pastoral.description}</p>
        <ul className="mt-4 space-y-1 text-sm text-ink">
          <li className="flex items-center gap-2">
            <User size={15} className="text-gold-dark" /> {pastoral.responsible}
          </li>
          <li className="flex items-center gap-2">
            <Clock size={15} className="text-gold-dark" /> {pastoral.meetingTime}
          </li>
          <li className="flex items-center gap-2">
            <MapPin size={15} className="text-gold-dark" /> {pastoral.location}
          </li>
        </ul>
        <Link to={`/pastorais/${pastoral.slug}`} className="mt-4 font-semibold text-marian">
          Saiba mais
        </Link>
      </div>
    </Card>
  )
}
