import { useQuery } from '@tanstack/react-query'
import { GC_TIME, STALE_TIME } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import type { EventCategory, NewsArticle, Notice, ParishEvent, Mass, Pastoral, Person, Sacrament, ParishSettings } from '@/types'
import { getSettings, listPeople } from '@/services/parishService'
import { getCampaignNews, getNewsBySlug, listNews, readCampaignCache } from '@/services/newsService'
import { getFeaturedNotices, listNotices } from '@/services/noticesService'
import { listEvents, listUpcomingEvents } from '@/services/eventsService'
import { listMasses, listUpcomingMasses } from '@/services/massesService'
import { listPastorals, getPastoralBySlug } from '@/services/pastoralService'
import { listSacraments, getSacramentBySlug } from '@/services/sacramentService'
import { getPersonBySlug } from '@/services/parishService'
import { getHomeBootstrap, readHomeCache, type HomeBootstrap } from '@/services/homeService'

export function useHomeQuery() {
  const cached = typeof window === 'undefined' ? null : readHomeCache()
  return useQuery<HomeBootstrap>({
    queryKey: queryKeys.home,
    queryFn: getHomeBootstrap,
    staleTime: STALE_TIME.home,
    gcTime: GC_TIME.long,
    initialData: cached ?? undefined,
    initialDataUpdatedAt: cached ? Date.now() - 30_000 : undefined,
    placeholderData: (previous) => previous ?? cached ?? undefined,
  })
}

export function useSettingsQuery() {
  return useQuery<ParishSettings>({
    queryKey: queryKeys.settings,
    queryFn: getSettings,
    staleTime: STALE_TIME.settings,
    gcTime: GC_TIME.long,
    refetchOnMount: 'always',
    placeholderData: (previous) => previous,
  })
}

export function useNewsQuery(params?: { includeDrafts?: boolean }) {
  return useQuery<NewsArticle[]>({
    queryKey: queryKeys.news.list(params),
    queryFn: () => listNews(params),
    staleTime: params?.includeDrafts ? STALE_TIME.admin : STALE_TIME.news,
    placeholderData: (previous) => previous,
  })
}

export function useCampaignNewsQuery() {
  const cached = typeof window === 'undefined' ? null : readCampaignCache()
  return useQuery<NewsArticle | null>({
    queryKey: queryKeys.news.campaign,
    queryFn: getCampaignNews,
    staleTime: STALE_TIME.news,
    gcTime: GC_TIME.long,
    initialData: cached ?? undefined,
    initialDataUpdatedAt: cached ? 1 : undefined,
    placeholderData: (previous) => previous ?? cached,
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
    placeholderData: (previous) => previous,
  })
}

export function useFeaturedNoticesQuery() {
  return useQuery<Notice[]>({
    queryKey: queryKeys.notices.featured,
    queryFn: getFeaturedNotices,
    staleTime: STALE_TIME.notices,
    placeholderData: (previous) => previous,
  })
}

export function useEventsQuery(category?: EventCategory | 'todos', options?: { admin?: boolean }) {
  return useQuery<ParishEvent[]>({
    queryKey: queryKeys.events.list(category, options),
    queryFn: () => listEvents(category, options),
    staleTime: options?.admin ? STALE_TIME.admin : STALE_TIME.events,
    placeholderData: (previous) => previous,
  })
}

export function useUpcomingEventsQuery(limit?: number) {
  return useQuery<ParishEvent[]>({
    queryKey: queryKeys.events.upcoming(limit),
    queryFn: () => listUpcomingEvents(limit),
    staleTime: STALE_TIME.events,
    placeholderData: (previous) => previous,
  })
}

export function useMassesQuery(params?: { month?: string; admin?: boolean; limit?: number }) {
  return useQuery<Mass[]>({
    queryKey: queryKeys.masses.list(params),
    queryFn: () => listMasses(params),
    staleTime: STALE_TIME.masses,
    placeholderData: (previous) => previous,
  })
}

export function useUpcomingMassesQuery(limit?: number) {
  return useQuery<Mass[]>({
    queryKey: queryKeys.masses.upcoming(limit),
    queryFn: () => listUpcomingMasses(limit),
    staleTime: STALE_TIME.masses,
    placeholderData: (previous) => previous,
  })
}

export function usePastoralsQuery(params?: { includeInactive?: boolean }) {
  return useQuery<Pastoral[]>({
    queryKey: queryKeys.pastorals.list(params),
    queryFn: () => listPastorals(params),
    staleTime: STALE_TIME.pastorals,
    placeholderData: (previous) => previous,
    refetchOnMount: 'always',
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
    gcTime: GC_TIME.long,
    placeholderData: (previous) => previous,
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

export function usePeopleQuery(params?: { includeInactive?: boolean }) {
  return useQuery<Person[]>({
    queryKey: queryKeys.people.list(params),
    queryFn: () => listPeople(params),
    staleTime: STALE_TIME.people,
    placeholderData: (previous) => previous,
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
