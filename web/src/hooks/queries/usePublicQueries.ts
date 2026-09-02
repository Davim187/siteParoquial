import { useQuery } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import type { EventCategory, NewsArticle, Notice, ParishEvent, Mass, Pastoral, Person, Sacrament, ParishSettings } from '@/types'
import { getSettings, listPeople } from '@/services/parishService'
import { listNews } from '@/services/newsService'
import { getFeaturedNotices, listNotices } from '@/services/noticesService'
import { listEvents, listUpcomingEvents } from '@/services/eventsService'
import { listMasses, listUpcomingMasses } from '@/services/massesService'
import { listPastorals, getPastoralBySlug } from '@/services/pastoralService'
import { listSacraments, getSacramentBySlug } from '@/services/sacramentService'
import { getPersonBySlug } from '@/services/parishService'
import { getNewsBySlug } from '@/services/newsService'

export function useSettingsQuery() {
  return useQuery<ParishSettings>({
    queryKey: queryKeys.settings,
    queryFn: getSettings,
    staleTime: STALE_TIME.settings,
  })
}

export function useNewsQuery(params?: { includeDrafts?: boolean }) {
  return useQuery<NewsArticle[]>({
    queryKey: queryKeys.news.list(params),
    queryFn: () => listNews(params),
    staleTime: STALE_TIME.news,
  })
}

export function useNewsDetailQuery(slug: string) {
  return useQuery<NewsArticle>({
    queryKey: queryKeys.news.detail(slug),
    queryFn: () => getNewsBySlug(slug),
    staleTime: STALE_TIME.news,
    enabled: Boolean(slug),
  })
}

export function useNoticesQuery(params?: { includeDrafts?: boolean }) {
  return useQuery<Notice[]>({
    queryKey: queryKeys.notices.list(params),
    queryFn: () => listNotices(params),
    staleTime: STALE_TIME.notices,
  })
}

export function useFeaturedNoticesQuery() {
  return useQuery<Notice[]>({
    queryKey: queryKeys.notices.featured,
    queryFn: getFeaturedNotices,
    staleTime: STALE_TIME.notices,
  })
}

export function useEventsQuery(category?: EventCategory | 'todos') {
  return useQuery<ParishEvent[]>({
    queryKey: queryKeys.events.list(category),
    queryFn: () => listEvents(category),
    staleTime: STALE_TIME.events,
  })
}

export function useUpcomingEventsQuery(limit?: number) {
  return useQuery<ParishEvent[]>({
    queryKey: queryKeys.events.upcoming(limit),
    queryFn: () => listUpcomingEvents(limit),
    staleTime: STALE_TIME.events,
  })
}

export function useMassesQuery(params?: { month?: string; admin?: boolean; limit?: number }) {
  return useQuery<Mass[]>({
    queryKey: queryKeys.masses.list(params),
    queryFn: () => listMasses(params),
    staleTime: STALE_TIME.masses,
  })
}

export function useUpcomingMassesQuery(limit?: number) {
  return useQuery<Mass[]>({
    queryKey: queryKeys.masses.upcoming(limit),
    queryFn: () => listUpcomingMasses(limit),
    staleTime: STALE_TIME.masses,
  })
}

export function usePastoralsQuery(params?: { includeInactive?: boolean }) {
  return useQuery<Pastoral[]>({
    queryKey: queryKeys.pastorals.list(params),
    queryFn: () => listPastorals(params),
    staleTime: STALE_TIME.pastorals,
  })
}

export function usePastoralDetailQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.pastorals.detail(slug),
    queryFn: () => getPastoralBySlug(slug),
    staleTime: STALE_TIME.pastorals,
    enabled: Boolean(slug),
  })
}

export function useSacramentsQuery() {
  return useQuery<Sacrament[]>({
    queryKey: queryKeys.sacraments.list,
    queryFn: listSacraments,
    staleTime: STALE_TIME.sacraments,
  })
}

export function useSacramentDetailQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.sacraments.detail(slug),
    queryFn: () => getSacramentBySlug(slug),
    staleTime: STALE_TIME.sacraments,
    enabled: Boolean(slug),
  })
}

export function usePeopleQuery() {
  return useQuery<Person[]>({
    queryKey: queryKeys.people.list,
    queryFn: listPeople,
    staleTime: STALE_TIME.people,
  })
}

export function usePersonDetailQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.people.detail(slug),
    queryFn: () => getPersonBySlug(slug),
    staleTime: STALE_TIME.people,
    enabled: Boolean(slug),
  })
}
