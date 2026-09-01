import { Link } from 'react-router-dom'
import type { Person } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function PersonCard({ person }: { person: Person }) {
  const href = person.type === 'padre' ? '/nossa-paroquia/padre' : person.type === 'diacono' ? '/nossa-paroquia/diacono' : undefined

  return (
    <Card className="flex h-full flex-col p-6 text-center">
      <img
        src={person.photo}
        alt={`Foto de ${person.name}`}
        className="mx-auto h-36 w-36 rounded-full object-cover ring-4 ring-gold/30"
        loading="lazy"
      />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">{person.role}</p>
      <h3 className="mt-1 font-serif text-2xl text-navy">{person.name}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{person.bio}</p>
      {person.quote ? <blockquote className="mt-4 font-serif italic text-marian">“{person.quote}”</blockquote> : null}
      {href ? (
        <div className="mt-5">
          <Button href={href} variant="outline" size="sm">
            Conhecer
          </Button>
        </div>
      ) : (
        <Link to="/nossa-paroquia" className="mt-5 text-sm font-semibold text-marian">
          Ver perfil
        </Link>
      )}
    </Card>
  )
}
