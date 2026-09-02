import { useQuery, useQueryClient } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { getDashboardStats, getFeast, getSettings } from '@/services/parishService'
import { listNewsCategories } from '@/services/newsService'
import { listPrayerRequests } from '@/services/prayerService'
import { listMessages } from '@/services/contactService'
import type { NewsArticle, ParishSettings } from '@/types'

function patchNewsListCache(client: ReturnType<typeof useQueryClient>, removedId: string) {
  client.setQueriesData<NewsArticle[]>(
    {
      queryKey: queryKeys.news.all,
      predicate: (query) => query.queryKey[1] === 'list',
    },
    (old) => (old ? old.filter((item) => item.id !== removedId) : old),
  )
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardStats,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function useNewsCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.news.categories,
    queryFn: async () => (await listNewsCategories()).data,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function usePrayerRequestsQuery() {
  return useQuery({
    queryKey: queryKeys.prayers,
    queryFn: listPrayerRequests,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function useMessagesQuery() {
  return useQuery({
    queryKey: queryKeys.messages,
    queryFn: listMessages,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function useFeastQuery() {
  return useQuery({
    queryKey: queryKeys.feast,
    queryFn: getFeast,
    staleTime: STALE_TIME.settings,
    placeholderData: (previous) => previous,
  })
}

export function useAdminSettingsQuery() {
  return useQuery<ParishSettings>({
    queryKey: queryKeys.settings,
    queryFn: getSettings,
    staleTime: STALE_TIME.settings,
    placeholderData: (previous) => previous,
  })
}

export function useInvalidateQueries() {
  const client = useQueryClient()
  return {
    news: async (removedId?: string) => {
      if (removedId) patchNewsListCache(client, removedId)
      await client.invalidateQueries({ queryKey: queryKeys.news.all })
    },
    notices: () => client.invalidateQueries({ queryKey: queryKeys.notices.all }),
    events: () => client.invalidateQueries({ queryKey: queryKeys.events.all }),
    masses: () => client.invalidateQueries({ queryKey: queryKeys.masses.all }),
    pastorals: () => client.invalidateQueries({ queryKey: queryKeys.pastorals.all }),
    sacraments: () => client.invalidateQueries({ queryKey: queryKeys.sacraments.all }),
    people: () => client.invalidateQueries({ queryKey: queryKeys.people.all }),
    settings: () => client.invalidateQueries({ queryKey: queryKeys.settings }),
    dashboard: () => client.invalidateQueries({ queryKey: queryKeys.dashboard }),
    prayers: () => client.invalidateQueries({ queryKey: queryKeys.prayers }),
    messages: () => client.invalidateQueries({ queryKey: queryKeys.messages }),
    feast: () => client.invalidateQueries({ queryKey: queryKeys.feast }),
    gallery: () => client.invalidateQueries({ queryKey: ['gallery'] }),
  }
}
