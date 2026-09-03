import { QueryClient } from '@tanstack/react-query'

export const STALE_TIME = {
  home: 3 * 60_000,
  settings: 10 * 60_000,
  parish: 10 * 60_000,
  news: 3 * 60_000,
  notices: 3 * 60_000,
  events: 3 * 60_000,
  masses: 2 * 60_000,
  pastorals: 10 * 60_000,
  sacraments: 15 * 60_000,
  people: 10 * 60_000,
  gallery: 5 * 60_000,
  admin: 30_000,
} as const

export const GC_TIME = {
  default: 30 * 60_000,
  long: 60 * 60_000,
} as const

function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= 1) return false
  if (error instanceof Error && 'status' in error) {
    const status = (error as Error & { status?: number }).status
    if (status && status >= 400 && status < 500) return false
  }
  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.news,
      gcTime: GC_TIME.default,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: false,
    },
  },
})
