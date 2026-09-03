import { apiRequest, mediaUrl } from '@/lib/api-client'
import { PLACEHOLDER_IMAGES } from '@/constants/placeholders'
import { queryClient, STALE_TIME, GC_TIME } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import type {
  GalleryAlbum,
  Mass,
  NewsArticle,
  Notice,
  ParishEvent,
  ParishSettings,
  Pastoral,
  Person,
} from '@/types'
import { cleanMapsUrl } from '@/utils/maps'

export type HomeBootstrap = {
  settings: ParishSettings
  campaign: NewsArticle | null
  notices: Notice[]
  masses: Mass[]
  events: ParishEvent[]
  news: NewsArticle[]
  people: Person[]
  pastorals: Pastoral[]
  gallery: GalleryAlbum[]
}

const HOME_CACHE_KEY = 'paroquia.home.v2'

function mapSettings(s: any): ParishSettings {
  return {
    name: s.name,
    slogan: s.slogan,
    welcomeText: s.welcomeText,
    address: s.address,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    instagram: s.instagram,
    facebook: s.facebook,
    youtube: s.youtube,
    secretaryHours: s.secretaryHours,
    mapsUrl: cleanMapsUrl(s.mapsUrl),
    pixKey: s.pixKey,
    bankDetails: s.bankDetails,
    streamingUrl: s.streamingUrl,
    history: s.history,
    mission: s.mission,
    vision: s.vision,
    patroness: s.patroness,
  }
}

function mapNews(item: any): NewsArticle {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle ?? undefined,
    excerpt: item.excerpt,
    content: item.content ?? '',
    author: item.authorName ?? '[EQUIPE DE COMUNICAÇÃO]',
    date: String(item.publishedAt ?? item.createdAt).slice(0, 10),
    image: mediaUrl(item.coverUrl) || PLACEHOLDER_IMAGES.news,
    category: item.categoryName ?? 'Comunidade',
    status: 'published',
    featured: Boolean(item.featured),
    gallery: [],
    showProgress: Boolean(item.showProgress),
    progressMode: item.progressMode === 'percent' ? 'percent' : 'amount',
    progressBadge: item.progressBadge ?? undefined,
    progressLabel: item.progressLabel ?? undefined,
    progressCurrent: Number(item.progressCurrent ?? 0),
    progressGoal: Number(item.progressGoal ?? 0),
  }
}

function mapNotice(item: any): Notice {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    date: String(item.startsAt).slice(0, 10),
    image: mediaUrl(item.imageUrl) || undefined,
    category:
      item.category === 'URGENTE'
        ? 'urgente'
        : item.category === 'LITURGIA'
          ? 'liturgico'
          : item.category === 'EVENTO'
            ? 'evento'
            : item.category === 'IMPORTANTE'
              ? 'informativo'
              : 'comunicado',
    featured: item.featured,
    status: item.active ? 'published' : 'draft',
  }
}

function mapMass(item: any): Mass {
  return {
    id: item.id,
    weekday: item.weekdayLabel,
    date: item.date,
    time: item.time,
    type: item.type,
    location: item.location,
    notes: item.notes ?? undefined,
    isToday: item.isToday,
    isTomorrow: item.isTomorrow,
    isNext: item.isNext,
  }
}

function mapEvent(item: any): ParishEvent {
  const typeToCategory: Record<string, ParishEvent['category']> = {
    MISSA: 'missa',
    ADORACAO: 'adoracao',
    CONFISSAO: 'confissao',
    EVENTO: 'evento',
    REUNIAO: 'reuniao',
    PASTORAL: 'pastoral',
    FORMACAO: 'formacao',
    CELEBRACAO: 'celebracao-especial',
    OUTRO: 'evento',
  }
  return {
    id: item.id,
    title: item.title,
    date: String(item.startsAt).slice(0, 10),
    time: String(item.startsAt).slice(11, 16),
    endTime: item.endsAt ? String(item.endsAt).slice(11, 16) : undefined,
    location: item.location,
    description: item.description,
    image: mediaUrl(item.imageUrl) || undefined,
    category: typeToCategory[item.type] ?? 'evento',
    responsible: item.responsible ?? undefined,
    externalUrl: item.externalUrl ?? undefined,
  }
}

function mapPerson(item: any): Person {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    role: item.roleTitle,
    photo: mediaUrl(item.imageUrl) || PLACEHOLDER_IMAGES.person,
    photoId: item.photoId ?? null,
    bio: item.bio,
    quote: item.quote ?? undefined,
    ministry: item.ministry ?? undefined,
    attendance: item.attendance ?? undefined,
    type: item.type === 'PADRE' ? 'padre' : item.type === 'DIACONO' ? 'diacono' : 'coordenacao',
  }
}

function mapPastoral(item: any): Pastoral {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    image: mediaUrl(item.imageUrl) || PLACEHOLDER_IMAGES.pastoral,
    responsible: item.responsible,
    contact: item.phone || item.email || '[CONTATO]',
    meetingTime: item.meetingTime || '[HORÁRIO]',
    location: item.location || '[LOCAL]',
    active: item.active,
  }
}

function mapAlbum(item: any): GalleryAlbum {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description ?? undefined,
    coverMediaId: item.coverMediaId ?? undefined,
    coverUrl: mediaUrl(item.coverUrl),
    coverThumbUrl: mediaUrl(item.coverThumbUrl ?? item.coverUrl),
    eventDate: String(item.eventDate).slice(0, 10),
    active: item.active,
    sortOrder: item.sortOrder,
    photoCount: item.photoCount,
    createdAt: item.createdAt,
  }
}

export function mapHomePayload(raw: any): HomeBootstrap {
  return {
    settings: mapSettings(raw.settings),
    campaign: raw.campaign ? mapNews(raw.campaign) : null,
    notices: (raw.notices ?? []).map(mapNotice),
    masses: (raw.masses ?? []).map(mapMass),
    events: (raw.events ?? []).map(mapEvent),
    news: (raw.news ?? []).map(mapNews),
    people: (raw.people ?? []).map(mapPerson),
    pastorals: (raw.pastorals ?? []).map(mapPastoral),
    gallery: (raw.gallery ?? []).map(mapAlbum),
  }
}

export function readHomeCache(): HomeBootstrap | null {
  try {
    const raw = sessionStorage.getItem(HOME_CACHE_KEY)
    return raw ? (JSON.parse(raw) as HomeBootstrap) : null
  } catch {
    return null
  }
}

export function writeHomeCache(data: HomeBootstrap) {
  try {
    sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

/** Popula caches do React Query para navegação instantânea nas demais páginas. */
export function seedQueryCachesFromHome(data: HomeBootstrap) {
  queryClient.setQueryData(queryKeys.settings, data.settings)
  queryClient.setQueryData(queryKeys.news.campaign, data.campaign)
  queryClient.setQueryData(queryKeys.notices.featured, data.notices)
  queryClient.setQueryData(queryKeys.masses.upcoming(4), data.masses)
  queryClient.setQueryData(queryKeys.events.upcoming(3), data.events.slice(0, 3))
  queryClient.setQueryData(queryKeys.events.upcoming(6), data.events)
  queryClient.setQueryData(queryKeys.people.list(), data.people)
  queryClient.setQueryData(queryKeys.pastorals.list(), data.pastorals)
  queryClient.setQueryData(queryKeys.gallery.albums({ limit: 3 }), {
    data: data.gallery,
    pagination: { page: 1, limit: 3, total: data.gallery.length, totalPages: 1 },
  })
}

export async function getHomeBootstrap(): Promise<HomeBootstrap> {
  const raw = await apiRequest<any>('/api/home', { auth: false })
  const data = mapHomePayload(raw)
  writeHomeCache(data)
  seedQueryCachesFromHome(data)
  return data
}

export function hydrateHomeFromSession() {
  const cached = readHomeCache()
  if (!cached) return null
  seedQueryCachesFromHome(cached)
  queryClient.setQueryData(queryKeys.home, cached)
  return cached
}

export function prefetchHome() {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.home,
    queryFn: getHomeBootstrap,
    staleTime: STALE_TIME.home,
    gcTime: GC_TIME.long,
  })
}
