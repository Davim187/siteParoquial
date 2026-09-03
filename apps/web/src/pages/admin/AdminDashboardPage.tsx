import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Church,
  HandHeart,
  Newspaper,
  Plus,
  Users,
} from 'lucide-react'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardQuery } from '@/hooks/queries/useAdminQueries'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/dates'

export function AdminDashboardPage() {
  usePageMeta('Dashboard | Admin')
  const { user, hasPermission } = useAuth()
  const { data, isLoading, error } = useDashboardQuery()

  if (isLoading && !data) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-slate-100" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl bg-slate-100" />
      </div>
    )
  }
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Erro'} />

  const cards = [
    {
      label: 'Notícias',
      value: data.publishedNews,
      hint: 'Publicadas',
      icon: Newspaper,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Avisos',
      value: data.activeNotices,
      hint: 'Ativos',
      icon: Bell,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Eventos',
      value: data.upcomingEvents,
      hint: 'Este mês',
      icon: CalendarDays,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Missas',
      value: data.upcomingMasses,
      hint: 'Horários ativos',
      icon: Church,
      tone: 'bg-marian/10 text-marian',
    },
    {
      label: 'Pastorais',
      value: data.pastorals ?? 0,
      hint: 'Ativas',
      icon: Users,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Pedidos de oração',
      value: data.prayerRequests,
      hint: 'Novos',
      icon: HandHeart,
      tone: 'bg-rose-50 text-rose-700',
    },
  ]

  const quickActions = [
    { href: '/admin/noticias', label: 'Nova notícia', perm: 'NEWS_CREATE', primary: true },
    { href: '/admin/agenda', label: 'Novo evento', perm: 'EVENTS_MANAGE' },
    { href: '/admin/avisos', label: 'Novo aviso', perm: 'NOTICES_MANAGE' },
    { href: '/admin/missas', label: 'Nova missa', perm: 'MASSES_MANAGE' },
  ].filter((item) => hasPermission(item.perm) || (item.perm.startsWith('NEWS') && hasPermission('NEWS_MANAGE')))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">
          Bem-vindo{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
          Gerencie o conteúdo da Paróquia Nossa Senhora das Graças em um só lugar.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
          Ações rápidas
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.href}
              href={action.href}
              size="sm"
              variant={action.primary ? 'primary' : 'secondary'}
            >
              <Plus size={15} />
              {action.label}
            </Button>
          ))}
          {hasPermission('MEDIA_MANAGE') ? (
            <Button href="/admin/midia" size="sm" variant="outline">
              <Plus size={15} />
              Enviar imagem
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 font-serif text-4xl text-navy">{card.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
                </div>
                <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-lg', card.tone)}>
                  <Icon size={18} />
                </span>
              </div>
            </article>
          )
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="font-serif text-xl text-navy">Próximos eventos</h2>
          <ul className="mt-4 space-y-3">
            {(data.upcomingEventsList ?? []).map((event: { id: string; title: string; startsAt: string }) => (
              <li key={event.id} className="border-b border-slate-100 pb-3 text-sm last:border-0">
                <p className="font-medium text-navy">{event.title}</p>
                <p className="text-slate-400">{formatDateTime(event.startsAt)}</p>
              </li>
            ))}
            {(data.upcomingEventsList ?? []).length === 0 ? (
              <li className="text-sm text-slate-400">Nenhum evento próximo.</li>
            ) : null}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="font-serif text-xl text-navy">Últimas notícias</h2>
          <ul className="mt-4 space-y-3">
            {(data.recentNews ?? []).map((news: { id: string; title: string; status: string }) => (
              <li key={news.id} className="border-b border-slate-100 pb-3 text-sm last:border-0">
                <Link to="/admin/noticias" className="font-medium text-navy hover:text-marian">
                  {news.title}
                </Link>
                <p className="text-slate-400">{news.status}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="font-serif text-xl text-navy">Atividades recentes</h2>
          <ul className="mt-4 space-y-3">
            {(data.activities ?? []).map(
              (item: {
                id: string
                action: string
                entity: string
                createdAt: string
                user?: { name?: string }
              }) => (
                <li key={item.id} className="border-b border-slate-100 pb-3 text-sm last:border-0">
                  <p className="font-medium text-navy">
                    {item.action} · {item.entity}
                  </p>
                  <p className="text-slate-400">
                    {item.user?.name ?? 'Sistema'} · {formatDateTime(item.createdAt)}
                  </p>
                </li>
              ),
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
