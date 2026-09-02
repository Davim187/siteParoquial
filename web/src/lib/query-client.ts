import { QueryClient } from '@tanstack/react-query'

export const STALE_TIME = {
  settings: 5 * 60_000,
  parish: 5 * 60_000,
  news: 2 * 60_000,
  notices: 2 * 60_000,
  events: 2 * 60_000,
  masses: 60_000,
  pastorals: 5 * 60_000,
  sacraments: 10 * 60_000,
  people: 5 * 60_000,
  gallery: 3 * 60_000,
  admin: 30_000,
} as const

export const GC_TIME = {
  default: 10 * 60_000,
  long: 30 * 60_000,
} as const

function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= 2) return false
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
    },
    mutations: {
      retry: false,
    },
  },
})
