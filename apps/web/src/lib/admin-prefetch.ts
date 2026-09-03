import { queryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { STALE_TIME } from '@/lib/query-client'
import { getDashboardStats } from '@/services/parishService'
import { listNews, listNewsCategories } from '@/services/newsService'
import { listNotices } from '@/services/noticesService'
import { listEvents } from '@/services/eventsService'
import { listMasses } from '@/services/massesService'
import { listPastorals } from '@/services/pastoralService'
import { listSacraments } from '@/services/sacramentService'
import { listPeople } from '@/services/parishService'
import { listPrayerRequests } from '@/services/prayerService'
import { listMessages } from '@/services/contactService'
import { listAlbums } from '@/services/galleryService'
import { apiRequest } from '@/lib/api-client'
import { listMedia } from '@/services/mediaService'

const prefetchers: Record<string, () => void> = {
  '/admin': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard,
      queryFn: getDashboardStats,
      staleTime: STALE_TIME.admin,
    })
  },
  '/admin/noticias': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.news.list({ includeDrafts: true }),
      queryFn: () => listNews({ includeDrafts: true }),
      staleTime: STALE_TIME.news,
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.news.categories,
      queryFn: async () => (await listNewsCategories()).data,
      staleTime: STALE_TIME.admin,
    })
  },
  '/admin/avisos': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.notices.list({ includeDrafts: true }),
      queryFn: () => listNotices({ includeDrafts: true }),
      staleTime: STALE_TIME.notices,
    })
  },
  '/admin/agenda': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.events.list('todos', { admin: true }),
      queryFn: () => listEvents('todos', { admin: true }),
      staleTime: STALE_TIME.events,
    })
  },
  '/admin/missas': () => {
    const month = new Date().toISOString().slice(0, 7)
    void queryClient.prefetchQuery({
      queryKey: queryKeys.masses.list({ month, admin: true }),
      queryFn: () => listMasses({ month, admin: true }),
      staleTime: STALE_TIME.masses,
    })
  },
  '/admin/pastorais': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.pastorals.list({ includeInactive: true }),
      queryFn: () => listPastorals({ includeInactive: true }),
      staleTime: STALE_TIME.pastorals,
    })
  },
  '/admin/sacramentos': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.sacraments.list,
      queryFn: listSacraments,
      staleTime: STALE_TIME.sacraments,
    })
  },
  '/admin/galeria': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.gallery.albums({ all: true }),
      queryFn: () => listAlbums({ all: true }),
      staleTime: STALE_TIME.gallery,
    })
  },
  '/admin/pessoas': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.people.list({ includeInactive: true }),
      queryFn: () => listPeople({ includeInactive: true }),
      staleTime: STALE_TIME.people,
    })
  },
  '/admin/oracoes': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.prayers,
      queryFn: listPrayerRequests,
      staleTime: STALE_TIME.admin,
    })
  },
  '/admin/mensagens': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.messages,
      queryFn: listMessages,
      staleTime: STALE_TIME.admin,
    })
  },
  '/admin/configuracoes': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.settings,
      queryFn: () => import('@/services/parishService').then((m) => m.getAdminSettings()),
      staleTime: STALE_TIME.settings,
    })
  },
  '/admin/festa': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.feast,
      queryFn: () => import('@/services/parishService').then((m) => m.getFeast()),
      staleTime: STALE_TIME.settings,
    })
  },
  '/admin/midia': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.media.list({ search: '' }),
      queryFn: async () => (await listMedia()).data,
      staleTime: STALE_TIME.admin,
    })
  },
  '/admin/usuarios': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.users.list,
      queryFn: async () => (await apiRequest<{ data: unknown[] }>('/api/users?limit=100')).data,
      staleTime: STALE_TIME.admin,
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.roles.list,
      queryFn: async () => (await apiRequest<{ data: unknown[] }>('/api/roles')).data,
      staleTime: STALE_TIME.admin,
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.permissions,
      queryFn: async () => (await apiRequest<{ data: unknown[] }>('/api/permissions')).data,
      staleTime: STALE_TIME.admin,
    })
  },
  '/admin/perfis': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.roles.list,
      queryFn: async () => (await apiRequest<{ data: unknown[] }>('/api/roles')).data,
      staleTime: STALE_TIME.admin,
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.permissions,
      queryFn: async () => (await apiRequest<{ data: unknown[] }>('/api/permissions')).data,
      staleTime: STALE_TIME.admin,
    })
  },
  '/admin/perfil': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.profile,
      queryFn: async () => (await apiRequest<{ data: unknown }>('/api/me/profile')).data,
      staleTime: STALE_TIME.admin,
    })
  },
}

export function prefetchAdminRoute(path: string) {
  prefetchers[path]?.()
}
