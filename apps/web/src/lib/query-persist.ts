import { queryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'

const PREFIX = 'paroquia.q.'

function asParams(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

type PersistSpec = {
  storageKey: string
  matches: (queryKey: readonly unknown[]) => boolean
  restore: (data: unknown) => void
}

const SPECS: PersistSpec[] = [
  {
    storageKey: 'settings',
    matches: (key) => key[0] === 'settings',
    restore: (data) => queryClient.setQueryData(queryKeys.settings, data),
  },
  {
    storageKey: 'news-list',
    matches: (key) => key[0] === 'news' && key[1] === 'list' && !asParams(key[2])?.includeDrafts,
    restore: (data) => queryClient.setQueryData(queryKeys.news.list(), data),
  },
  {
    storageKey: 'news-admin',
    matches: (key) => key[0] === 'news' && key[1] === 'list' && Boolean(asParams(key[2])?.includeDrafts),
    restore: (data) => queryClient.setQueryData(queryKeys.news.list({ includeDrafts: true }), data),
  },
  {
    storageKey: 'notices-list',
    matches: (key) => key[0] === 'notices' && key[1] === 'list' && !asParams(key[2])?.includeDrafts,
    restore: (data) => queryClient.setQueryData(queryKeys.notices.list(), data),
  },
  {
    storageKey: 'notices-admin',
    matches: (key) => key[0] === 'notices' && key[1] === 'list' && Boolean(asParams(key[2])?.includeDrafts),
    restore: (data) => queryClient.setQueryData(queryKeys.notices.list({ includeDrafts: true }), data),
  },
  {
    storageKey: 'events-todos',
    matches: (key) =>
      key[0] === 'events' && key[1] === 'list' && key[2] === 'todos' && !asParams(key[3])?.admin,
    restore: (data) => queryClient.setQueryData(queryKeys.events.list('todos'), data),
  },
  {
    storageKey: 'events-admin',
    matches: (key) =>
      key[0] === 'events' && key[1] === 'list' && key[2] === 'todos' && Boolean(asParams(key[3])?.admin),
    restore: (data) => queryClient.setQueryData(queryKeys.events.list('todos', { admin: true }), data),
  },
  {
    storageKey: 'masses-upcoming-4',
    matches: (key) => key[0] === 'masses' && key[1] === 'upcoming' && key[2] === 4,
    restore: (data) => queryClient.setQueryData(queryKeys.masses.upcoming(4), data),
  },
  {
    storageKey: 'pastorals',
    matches: (key) => key[0] === 'pastorals' && key[1] === 'list' && !asParams(key[2])?.includeInactive,
    restore: (data) => queryClient.setQueryData(queryKeys.pastorals.list(), data),
  },
  {
    storageKey: 'pastorals-admin',
    matches: (key) =>
      key[0] === 'pastorals' && key[1] === 'list' && Boolean(asParams(key[2])?.includeInactive),
    restore: (data) => queryClient.setQueryData(queryKeys.pastorals.list({ includeInactive: true }), data),
  },
  {
    storageKey: 'people',
    matches: (key) => key[0] === 'people' && key[1] === 'list' && !asParams(key[2])?.includeInactive,
    restore: (data) => queryClient.setQueryData(queryKeys.people.list(), data),
  },
  {
    storageKey: 'people-admin',
    matches: (key) =>
      key[0] === 'people' && key[1] === 'list' && Boolean(asParams(key[2])?.includeInactive),
    restore: (data) => queryClient.setQueryData(queryKeys.people.list({ includeInactive: true }), data),
  },
  {
    storageKey: 'sacraments',
    matches: (key) => key[0] === 'sacraments' && key[1] === 'list',
    restore: (data) => queryClient.setQueryData(queryKeys.sacraments.list, data),
  },
  {
    storageKey: 'gallery-24',
    matches: (key) => {
      const params = asParams(key[2])
      return key[0] === 'gallery' && key[1] === 'albums' && params?.limit === 24 && !params?.all
    },
    restore: (data) => queryClient.setQueryData(queryKeys.gallery.albums({ limit: 24 }), data),
  },
  {
    storageKey: 'gallery-admin',
    matches: (key) => {
      const params = asParams(key[2])
      return key[0] === 'gallery' && key[1] === 'albums' && Boolean(params?.all)
    },
    restore: (data) => queryClient.setQueryData(queryKeys.gallery.albums({ all: true, limit: 100 }), data),
  },
  {
    storageKey: 'dashboard',
    matches: (key) => key[0] === 'dashboard',
    restore: (data) => queryClient.setQueryData(queryKeys.dashboard, data),
  },
  {
    storageKey: 'prayers',
    matches: (key) => key[0] === 'prayers',
    restore: (data) => queryClient.setQueryData(queryKeys.prayers, data),
  },
  {
    storageKey: 'messages',
    matches: (key) => key[0] === 'messages',
    restore: (data) => queryClient.setQueryData(queryKeys.messages, data),
  },
  {
    storageKey: 'feast',
    matches: (key) => key[0] === 'feast',
    restore: (data) => queryClient.setQueryData(queryKeys.feast, data),
  },
  {
    storageKey: 'users',
    matches: (key) => key[0] === 'users' && key[1] === 'list',
    restore: (data) => queryClient.setQueryData(queryKeys.users.list, data),
  },
  {
    storageKey: 'roles',
    matches: (key) => key[0] === 'roles' && key[1] === 'list',
    restore: (data) => queryClient.setQueryData(queryKeys.roles.list, data),
  },
  {
    storageKey: 'permissions',
    matches: (key) => key[0] === 'permissions',
    restore: (data) => queryClient.setQueryData(queryKeys.permissions, data),
  },
  {
    storageKey: 'profile',
    matches: (key) => key[0] === 'profile',
    restore: (data) => queryClient.setQueryData(queryKeys.profile, data),
  },
  {
    storageKey: 'media',
    matches: (key) => key[0] === 'media' && key[1] === 'list',
    restore: (data) => queryClient.setQueryData(queryKeys.media.list({ search: '' }), data),
  },
]

function write(storageKey: string, data: unknown) {
  try {
    sessionStorage.setItem(PREFIX + storageKey, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

function read(storageKey: string): unknown | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + storageKey)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function installQueryPersistence() {
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated') return
    const query = event.query
    if (query.state.status !== 'success' || query.state.data === undefined) return
    const key = query.queryKey
    for (const spec of SPECS) {
      if (spec.matches(key)) write(spec.storageKey, query.state.data)
    }
  })
}

export function hydratePersistedQueries() {
  for (const spec of SPECS) {
    const data = read(spec.storageKey)
    if (data != null) spec.restore(data)
  }
}
