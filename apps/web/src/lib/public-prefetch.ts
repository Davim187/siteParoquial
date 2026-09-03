import { queryClient, STALE_TIME } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { listNews } from '@/services/newsService'
import { listNotices } from '@/services/noticesService'
import { listEvents } from '@/services/eventsService'
import { listMasses } from '@/services/massesService'
import { listPastorals } from '@/services/pastoralService'
import { listSacraments } from '@/services/sacramentService'
import { listPeople } from '@/services/parishService'
import { listAlbums } from '@/services/galleryService'
import { prefetchHome } from '@/services/homeService'

const prefetchers: Record<string, () => void> = {
  '/': () => {
    void prefetchHome()
  },
  '/noticias': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.news.list(),
      queryFn: () => listNews(),
      staleTime: STALE_TIME.news,
    })
  },
  '/avisos': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.notices.list(),
      queryFn: () => listNotices(),
      staleTime: STALE_TIME.notices,
    })
  },
  '/missas': () => {
    const month = new Date().toISOString().slice(0, 7)
    void queryClient.prefetchQuery({
      queryKey: queryKeys.masses.list({ month, limit: 50 }),
      queryFn: () => listMasses({ month, limit: 50 }),
      staleTime: STALE_TIME.masses,
    })
  },
  '/agenda': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.events.list('todos'),
      queryFn: () => listEvents('todos'),
      staleTime: STALE_TIME.events,
    })
  },
  '/pastorais': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.pastorals.list(),
      queryFn: () => listPastorals(),
      staleTime: STALE_TIME.pastorals,
    })
  },
  '/sacramentos': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.sacraments.list,
      queryFn: listSacraments,
      staleTime: STALE_TIME.sacraments,
    })
  },
  '/galeria': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.gallery.albums({ limit: 24 }),
      queryFn: () => listAlbums({ limit: 24 }),
      staleTime: STALE_TIME.gallery,
    })
  },
  '/nossa-paroquia': () => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.people.list(),
      queryFn: () => listPeople(),
      staleTime: STALE_TIME.people,
    })
  },
}

export function prefetchPublicRoute(path: string) {
  prefetchers[path]?.()
}
