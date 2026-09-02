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
      queryKey: queryKeys.events.list('todos'),
      queryFn: () => listEvents('todos'),
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
      queryKey: queryKeys.people.list,
      queryFn: listPeople,
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
}

export function prefetchAdminRoute(path: string) {
  prefetchers[path]?.()
}
