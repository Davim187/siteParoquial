import { useQuery, useQueryClient } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { getDashboardStats, getAdminSettings, getFeast } from '@/services/parishService'
import { listNewsCategories, writeCampaignCache } from '@/services/newsService'
import { listPrayerRequests } from '@/services/prayerService'
import { listMessages } from '@/services/contactService'
import type { NewsArticle, ParishSettings } from '@/types'

function syncCampaignCache(client: ReturnType<typeof useQueryClient>, updated?: NewsArticle, removedId?: string) {
  client.setQueryData<NewsArticle | null>(queryKeys.news.campaign, (current) => {
    if (removedId && current?.id === removedId) {
      writeCampaignCache(null)
      return null
    }
    if (!updated) return current
    const isLive = updated.showProgress && updated.status === 'published'
    if (isLive) {
      writeCampaignCache(updated)
      return updated
    }
    if (current?.id === updated.id) {
      writeCampaignCache(null)
      return null
    }
    return current
  })
}

function patchNewsListCache(client: ReturnType<typeof useQueryClient>, removedId: string) {
  client.setQueriesData<NewsArticle[]>(
    {
      queryKey: queryKeys.news.all,
      predicate: (query) => query.queryKey[1] === 'list',
    },
    (old) => (old ? old.filter((item) => item.id !== removedId) : old),
  )
}

function upsertNewsInListCache(client: ReturnType<typeof useQueryClient>, updated: NewsArticle) {
  client.setQueriesData<NewsArticle[]>(
    {
      queryKey: queryKeys.news.all,
      predicate: (query) => query.queryKey[1] === 'list',
    },
    (old) => {
      if (!old) return old
      const exists = old.some((item) => item.id === updated.id)
      const next = exists
        ? old.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        : [updated, ...old]
      if (!updated.featured) return next
      return next.map((item) => (item.id === updated.id ? item : { ...item, featured: false }))
    },
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
    queryFn: getAdminSettings,
    staleTime: STALE_TIME.settings,
    placeholderData: (previous) => previous,
  })
}

export function useInvalidateQueries() {
  const client = useQueryClient()
  return {
    news: (removedId?: string, updated?: NewsArticle) => {
      if (removedId) patchNewsListCache(client, removedId)
      if (updated) upsertNewsInListCache(client, updated)
      syncCampaignCache(client, updated, removedId)
      void client.invalidateQueries({ queryKey: queryKeys.news.all })
    },
    patchNews: (updated: NewsArticle) => {
      void client.cancelQueries({ queryKey: queryKeys.news.all })
      upsertNewsInListCache(client, updated)
      syncCampaignCache(client, updated)
    },
    removeNews: (id: string) => {
      void client.cancelQueries({ queryKey: queryKeys.news.all })
      patchNewsListCache(client, id)
      syncCampaignCache(client, undefined, id)
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
