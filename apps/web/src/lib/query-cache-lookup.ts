import { queryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import type { NewsArticle, Pastoral, Person, Sacrament, GalleryAlbum } from '@/types'
import type { HomeBootstrap } from '@/services/homeService'

function homeCache(): HomeBootstrap | undefined {
  return queryClient.getQueryData<HomeBootstrap>(queryKeys.home)
}

export function findNewsInCache(slug: string): NewsArticle | undefined {
  const home = homeCache()?.news.find((item) => item.slug === slug)
  if (home) return home

  const lists = queryClient.getQueriesData<NewsArticle[]>({ queryKey: queryKeys.news.all })
  for (const [, data] of lists) {
    const found = data?.find((item) => item.slug === slug)
    if (found) return found
  }
  return undefined
}

export function findPastoralInCache(slug: string): Pastoral | undefined {
  const home = homeCache()?.pastorals.find((item) => item.slug === slug)
  if (home) return home
  const lists = queryClient.getQueriesData<Pastoral[]>({ queryKey: queryKeys.pastorals.all })
  for (const [, data] of lists) {
    const found = data?.find((item) => item.slug === slug)
    if (found) return found
  }
  return undefined
}

export function findPersonInCache(slug: string): Person | undefined {
  const home = homeCache()?.people.find((item) => item.slug === slug)
  if (home) return home
  const lists = queryClient.getQueriesData<Person[]>({ queryKey: queryKeys.people.all })
  for (const [, data] of lists) {
    const found = data?.find((item) => item.slug === slug)
    if (found) return found
  }
  return undefined
}

export function findSacramentInCache(slug: string): Sacrament | undefined {
  const list = queryClient.getQueryData<Sacrament[]>(queryKeys.sacraments.list)
  return list?.find((item) => item.slug === slug)
}

export function findAlbumInCache(slug: string): GalleryAlbum | undefined {
  const home = homeCache()?.gallery.find((item) => item.slug === slug)
  if (home) return home
  const lists = queryClient.getQueriesData<{ data: GalleryAlbum[] }>({ queryKey: ['gallery', 'albums'] })
  for (const [, data] of lists) {
    const found = data?.data?.find((item) => item.slug === slug)
    if (found) return found
  }
  return undefined
}
