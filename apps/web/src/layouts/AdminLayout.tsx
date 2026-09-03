import { NavLink, Outlet, Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Church,
  GalleryHorizontal,
  HandHeart,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Settings,
  Sparkles,
  Users,
  BookOpen,
  Shield,
  ShieldCheck,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'
import { BRAND } from '@/config/brand'
import { BrandMark } from '@/components/layout/Logo'
import { getNotifications, type AdminActivityItem, type AdminNotificationAlert } from '@/services/parishService'
import { prefetchAdminRoute } from '@/lib/admin-prefetch'
import { formatDateTime } from '@/utils/dates'
import { ADMIN_ROUTE_PERMISSIONS, permissionsForAdminPath } from '@/constants/admin-routes'
import { ErrorState } from '@/components/ui/Feedback'

const STORAGE_KEY = 'admin_sidebar_collapsed'

const groups = [
  {
    title: 'Principal',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Conteúdo',
    items: [
      { to: '/admin/noticias', label: 'Notícias', icon: Newspaper },
      { to: '/admin/avisos', label: 'Avisos', icon: Bell },
      { to: '/admin/agenda', label: 'Eventos', icon: CalendarDays },
      { to: '/admin/missas', label: 'Missas', icon: Church },
      { to: '/admin/pastorais', label: 'Pastorais', icon: Users },
      { to: '/admin/sacramentos', label: 'Sacramentos', icon: BookOpen },
      { to: '/admin/galeria', label: 'Galeria', icon: GalleryHorizontal },
    ],
  },
  {
    title: 'Comunidade',
    items: [
      { to: '/admin/pessoas', label: 'Pessoas', icon: Users },
      { to: '/admin/oracoes', label: 'Pedidos de oração', icon: HandHeart },
      { to: '/admin/mensagens', label: 'Mensagens', icon: Mail },
    ],
  },
  {
    title: 'Mídia',
    items: [{ to: '/admin/midia', label: 'Biblioteca de mídia', icon: Images }],
  },
  {
    title: 'Sistema',
    items: [
      { to: '/admin/festa', label: 'Festa da Padroeira', icon: Sparkles },
      { to: '/admin/usuarios', label: 'Usuários', icon: Shield },
      { to: '/admin/perfis', label: 'Perfis de acesso', icon: ShieldCheck },
      { to: '/admin/perfil', label: 'Meu perfil', icon: UserRound },
      { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

function breadcrumbFromPath(pathname: string) {
  const map: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/noticias': 'Notícias',
    '/admin/avisos': 'Avisos',
    '/admin/agenda': 'Eventos',
    '/admin/missas': 'Missas',
    '/admin/pastorais': 'Pastorais',
    '/admin/sacramentos': 'Sacramentos',
    '/admin/galeria': 'Galeria',
    '/admin/pessoas': 'Pessoas',
    '/admin/oracoes': 'Pedidos de oração',
    '/admin/mensagens': 'Mensagens',
    '/admin/midia': 'Biblioteca de mídia',
    '/admin/festa': 'Festa da Padroeira',
    '/admin/usuarios': 'Usuários',
    '/admin/perfis': 'Perfis de acesso',
    '/admin/perfil': 'Meu perfil',
    '/admin/configuracoes': 'Configurações',
  }
  return map[pathname] ?? 'Painel'
}

function formatActivityLabel(item: AdminActivityItem) {
  const actionLabels: Record<string, string> = {
    create: 'Criou',
    update: 'Atualizou',
    delete: 'Excluiu',
    'status:DRAFT': 'Moveu para rascunho',
    'status:PUBLISHED': 'Publicou',
    'status:ARCHIVED': 'Arquivou',
  }
  const entityLabels: Record<string, string> = {
    news: 'notícia',
    notice: 'aviso',
    event: 'evento',
    pastoral: 'pastoral',
    person: 'pessoa',
    user: 'usuário',
    media: 'mídia',
    settings: 'configuração',
  }
  const action = actionLabels[item.action] ?? item.action
  const entity = entityLabels[item.entity] ?? item.entity
  return `${action} ${entity}`
}

export function AdminLayout() {
  const { isAuthenticated, user, logout, hasAnyPermission } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [alerts, setAlerts] = useState<AdminNotificationAlert[]>([])
  const [activities, setActivities] = useState<AdminActivityItem[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
      if (!notificationsRef.current?.contains(event.target as Node)) setNotificationsOpen(false)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  async function loadNotifications() {
    setNotificationsLoading(true)
    try {
      const data = await getNotifications()
      setAlerts(data.alerts ?? [])
      setActivities(data.activities ?? [])
    } catch {
      setAlerts([])
      setActivities([])
    } finally {
      setNotificationsLoading(false)
    }
  }

  async function toggleNotifications() {
    const next = !notificationsOpen
    setNotificationsOpen(next)
    setMenuOpen(false)
    if (next) await loadNotifications()
  }

  useEffect(() => {
    if (!isAuthenticated) return
    void loadNotifications()
    prefetchAdminRoute(location.pathname)
    prefetchAdminRoute('/admin')

    const warmRoutes = [
      '/admin/noticias',
      '/admin/avisos',
      '/admin/agenda',
      '/admin/missas',
      '/admin/pastorais',
      '/admin/sacramentos',
      '/admin/galeria',
      '/admin/pessoas',
      '/admin/oracoes',
      '/admin/mensagens',
      '/admin/midia',
      '/admin/usuarios',
      '/admin/perfis',
      '/admin/configuracoes',
      '/admin/festa',
      '/admin/perfil',
    ]
    const warm = () => {
      for (const route of warmRoutes) {
        const perms = ADMIN_ROUTE_PERMISSIONS[route]
        if (!perms || hasAnyPermission(...perms)) prefetchAdminRoute(route)
      }
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(warm, 1500)
    return () => window.clearTimeout(timer)
  }, [isAuthenticated, location.pathname, hasAnyPermission])

  const initials = useMemo(() => {
    const parts = (user?.name ?? 'A').trim().split(/\s+/)
    return ((parts[0]?.[0] ?? 'A') + (parts[1]?.[0] ?? '')).toUpperCase()
  }, [user?.name])

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />

  const routePermissions = permissionsForAdminPath(location.pathname)
  const accessDenied =
    routePermissions !== undefined && !hasAnyPermission(...routePermissions)

  function canAccessAdminPath(path: string) {
    const perms = ADMIN_ROUTE_PERMISSIONS[path]
    if (!perms) return true
    return hasAnyPermission(...perms)
  }

  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Administrador'
      : user?.role === 'EDITOR'
        ? 'Editor'
        : user?.role === 'SECRETARIA'
          ? 'Secretaria'
          : user?.role === 'COMUNICACAO'
            ? 'Comunicação'
            : user?.role

  function SidebarNav({ compact = false, fill = true }: { compact?: boolean; fill?: boolean }) {
    return (
      <nav
        className={cn(
          'py-4',
          compact ? 'space-y-2 px-2' : 'space-y-5 px-2',
          fill && 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden',
        )}
        aria-label="Admin"
      >
        {groups.map((group, groupIndex) => (
          <div key={group.title}>
            {!compact ? (
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                {group.title}
              </p>
            ) : groupIndex > 0 ? (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" aria-hidden />
            ) : null}
            <div className={cn('space-y-1', compact && 'flex flex-col items-center')}>
              {group.items.filter((item) => canAccessAdminPath(item.to)).map((item) => {
                const Icon = item.icon
                const link = (
                  <NavLink
                    to={item.to}
                    end={'end' in item ? Boolean(item.end) : false}
                    onClick={() => setMobileOpen(false)}
                    onMouseEnter={() => prefetchAdminRoute(item.to)}
                    title={compact ? item.label : undefined}
                    aria-label={item.label}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center rounded-lg text-sm text-slate-300 transition hover:bg-white/8 hover:text-white',
                        compact
                          ? 'h-10 w-10 shrink-0 justify-center px-0'
                          : 'w-full gap-3 px-3 py-2.5',
                        isActive && 'bg-white/12 font-medium text-white',
                      )
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className={cn(compact ? 'sr-only' : 'truncate')}>{item.label}</span>
                  </NavLink>
                )
                return compact ? (
                  <div key={item.to} className="flex w-full justify-center">
                    {link}
                  </div>
                ) : (
                  <div key={item.to}>{link}</div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    )
  }

  const sidebarInner = (compact: boolean, options?: { scrollable?: boolean }) => (
    <div
      className={cn(
        'flex flex-col overflow-x-hidden',
        options?.scrollable === false ? 'h-full' : '',
      )}
    >
      <div className={cn('shrink-0 border-b border-white/10', compact ? 'px-2 py-4' : 'px-4 py-4')}>
        <div className={cn('flex items-center', compact ? 'justify-center' : 'gap-3')}>
          <BrandMark size={compact ? 'sm' : 'md'} tone="white" className="shadow-md ring-1 ring-white/10" />
          {!compact ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{BRAND.shortName}</p>
              <p className="truncate text-[11px] text-slate-400">{BRAND.location}</p>
              <p className="text-[10px] text-slate-500">Painel administrativo</p>
            </div>
          ) : null}
        </div>
      </div>
      <SidebarNav compact={compact} fill={options?.scrollable === false} />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div
        className={cn(
          'hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:flex-col md:overflow-hidden md:bg-navy-deep md:text-white md:transition-all md:duration-300',
          collapsed ? 'md:w-[72px]' : 'md:w-[272px]',
        )}
      >
        {sidebarInner(collapsed, { scrollable: false })}
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu administrativo">
          <button
            type="button"
            className="absolute inset-0 bg-navy-deep/50 backdrop-blur-[1px]"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100vw-2.5rem,18rem)] max-w-full flex-col overflow-hidden bg-navy-deep text-white shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3">
              <p className="px-1 text-sm font-semibold">Menu</p>
              <button
                type="button"
                className="rounded-lg p-2 text-white/70 hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{sidebarInner(false)}</div>
          </div>
        </div>
      ) : null}

      <div className={cn('min-w-0 transition-all duration-300', collapsed ? 'md:pl-[72px]' : 'md:pl-[272px]')}>
        <header className="sticky top-0 z-30 overflow-visible border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
                aria-label="Abrir menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={18} />
              </button>
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:inline-flex"
                aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
                onClick={() => setCollapsed((value) => !value)}
              >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs text-slate-400">
                  Dashboard / {breadcrumbFromPath(location.pathname)}
                </p>
                <h1 className="truncate font-serif text-xl text-navy md:text-2xl">
                  {breadcrumbFromPath(location.pathname)}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label="Notificações"
                  aria-expanded={notificationsOpen}
                  aria-haspopup="true"
                  onClick={(event) => {
                    event.stopPropagation()
                    void toggleNotifications()
                  }}
                >
                  <Bell size={18} />
                  {alerts.length > 0 ? (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                      {alerts.length > 9 ? '9+' : alerts.length}
                    </span>
                  ) : null}
                </button>
                {notificationsOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-fade-in">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="font-medium text-slate-800">Notificações</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notificationsLoading ? (
                        <p className="px-4 py-6 text-center text-sm text-slate-400">Carregando...</p>
                      ) : alerts.length === 0 && activities.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-slate-400">
                          Nenhuma notificação no momento.
                        </p>
                      ) : (
                        <>
                          {alerts.length > 0 ? (
                            <div className="border-b border-slate-100">
                              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                                Pendentes
                              </p>
                              <ul>
                                {alerts.map((item) => (
                                  <li key={item.id}>
                                    <Link
                                      to={item.href}
                                      className="block px-4 py-3 text-sm hover:bg-slate-50"
                                      onClick={() => setNotificationsOpen(false)}
                                    >
                                      <p className="font-medium text-navy">{item.title}</p>
                                      <p className="mt-0.5 text-xs text-slate-400">
                                        {formatDateTime(item.createdAt)}
                                      </p>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {activities.length > 0 ? (
                            <div>
                              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                                Atividades recentes
                              </p>
                              <ul className="divide-y divide-slate-100">
                                {activities.map((item) => (
                                  <li key={item.id} className="px-4 py-3 text-sm">
                                    <p className="font-medium text-navy">{formatActivityLabel(item)}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {item.user?.name ?? 'Sistema'} · {formatDateTime(item.createdAt)}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 py-1.5 pr-2 pl-1.5 hover:bg-slate-50"
                  onClick={(event) => {
                    event.stopPropagation()
                    setMenuOpen((value) => !value)
                    setNotificationsOpen(false)
                  }}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marian text-xs font-semibold text-white">
                      {initials}
                    </span>
                  )}
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[10rem] truncate text-sm font-medium text-slate-800">
                      {user?.name}
                    </span>
                    <span className="block text-[11px] text-slate-400">{roleLabel}</span>
                  </span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl animate-fade-in"
                  >
                    <Link
                      to="/admin/perfil"
                      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      Meu perfil
                    </Link>
                    <Link
                      to="/admin/configuracoes"
                      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      Configurações
                    </Link>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                      role="menuitem"
                      onClick={async () => {
                        await logout()
                        navigate('/admin/login')
                      }}
                    >
                      <LogOut size={15} /> Sair
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          {accessDenied ? (
            <ErrorState message="Você não possui permissão para acessar esta página." />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
