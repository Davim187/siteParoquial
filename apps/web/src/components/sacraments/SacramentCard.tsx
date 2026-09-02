import { Link } from 'react-router-dom'
import type { Sacrament } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function SacramentCard({ sacrament }: { sacrament: Sacrament }) {
  return (
    <Card className="flex h-full flex-col p-6">
      <h3 className="font-serif text-2xl text-navy">{sacrament.name}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{sacrament.summary}</p>
      <div className="mt-5">
        <Button href={`/sacramentos/${sacrament.slug}`} variant="outline" size="sm">
          Quero saber mais
        </Button>
      </div>
      <Link to={`/sacramentos/${sacrament.slug}`} className="sr-only">
        {sacrament.name}
      </Link>
    </Card>
  )
}
