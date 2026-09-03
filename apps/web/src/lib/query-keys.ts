export const queryKeys = {
  settings: ['settings'] as const,
  news: {
    all: ['news'] as const,
    list: (params?: { includeDrafts?: boolean }) => ['news', 'list', params] as const,
    campaign: ['news', 'campaign'] as const,
    detail: (slug: string) => ['news', 'detail', slug] as const,
    categories: ['news', 'categories'] as const,
  },
  notices: {
    all: ['notices'] as const,
    list: (params?: { includeDrafts?: boolean }) => ['notices', 'list', params] as const,
    featured: ['notices', 'featured'] as const,
  },
  events: {
    all: ['events'] as const,
    list: (category?: string) => ['events', 'list', category] as const,
    upcoming: (limit?: number) => ['events', 'upcoming', limit] as const,
  },
  masses: {
    all: ['masses'] as const,
    list: (params?: { month?: string; admin?: boolean; limit?: number }) =>
      ['masses', 'list', params] as const,
    upcoming: (limit?: number) => ['masses', 'upcoming', limit] as const,
  },
  pastorals: {
    all: ['pastorals'] as const,
    list: (params?: { includeInactive?: boolean }) => ['pastorals', 'list', params] as const,
    detail: (slug: string) => ['pastorals', 'detail', slug] as const,
  },
  sacraments: {
    all: ['sacraments'] as const,
    list: ['sacraments', 'list'] as const,
    detail: (slug: string) => ['sacraments', 'detail', slug] as const,
  },
  people: {
    all: ['people'] as const,
    list: ['people', 'list'] as const,
    detail: (slug: string) => ['people', 'detail', slug] as const,
  },
  gallery: {
    albums: (params?: { all?: boolean; page?: number }) => ['gallery', 'albums', params] as const,
    album: (slug: string, params?: { all?: boolean }) => ['gallery', 'album', slug, params] as const,
  },
  dashboard: ['dashboard'] as const,
  feast: ['feast'] as const,
  prayers: ['prayers'] as const,
  messages: ['messages'] as const,
}
