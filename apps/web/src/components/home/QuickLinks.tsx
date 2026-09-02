import { CalendarDays, Church, HeartHandshake, Newspaper, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const items = [
  { to: '/missas', label: 'Horários das Missas', icon: Church },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/noticias', label: 'Notícias', icon: Newspaper },
  { to: '/pastorais', label: 'Pastorais', icon: Users },
  { to: '/contato', label: 'Contato', icon: HeartHandshake },
]

export function QuickLinks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex h-full flex-col items-center gap-3 rounded-2xl border border-line bg-white px-4 py-6 text-center transition hover:-translate-y-0.5 hover:border-gold hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marian/10 text-marian">
                <Icon size={22} />
              </span>
              <span className="text-sm font-semibold text-navy">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
