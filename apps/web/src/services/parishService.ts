import { apiRequest, mediaUrl } from '@/lib/api-client'
import type { ParishSettings, Person, PatronFeast } from '@/types'
import { cleanMapsUrl } from '@/utils/maps'

export async function getSettings(): Promise<ParishSettings> {
  const s = await apiRequest<any>('/api/settings', { auth: false })
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

export async function saveSettings(settings: ParishSettings) {
  const current = await apiRequest<any>('/api/settings')
  return apiRequest('/api/settings', {
    method: 'PUT',
    json: {
      ...current,
      ...settings,
      mapsUrl: cleanMapsUrl(settings.mapsUrl),
      patroness: settings.patroness ?? current.patroness,
    },
  })
}

export async function getFeast(): Promise<PatronFeast> {
  const s = await apiRequest<any>('/api/settings', { auth: false })
  return s.feast
}

export async function saveFeast(feast: PatronFeast) {
  const current = await apiRequest<any>('/api/settings')
  return apiRequest('/api/settings', { method: 'PUT', json: { ...current, feast } })
}

export async function listPeople(): Promise<Person[]> {
  const result = await apiRequest<{ data: any[] }>('/api/people', { auth: false })
  return result.data.map(
    (item): Person => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      role: item.roleTitle,
      photo:
        mediaUrl(item.imageUrl) ||
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      photoId: item.photoId ?? null,
      bio: item.bio,
      quote: item.quote ?? undefined,
      ministry: item.ministry ?? undefined,
      attendance: item.attendance ?? undefined,
      type: item.type === 'PADRE' ? 'padre' : item.type === 'DIACONO' ? 'diacono' : 'coordenacao',
    }),
  )
}

export async function getPersonBySlug(slug: string) {
  const item = await apiRequest<any>(`/api/people/${slug}`, { auth: false })
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    role: item.roleTitle,
    photo:
      mediaUrl(item.imageUrl) ||
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    photoId: item.photoId ?? null,
    bio: item.bio,
    quote: item.quote ?? undefined,
    ministry: item.ministry ?? undefined,
    attendance: item.attendance ?? undefined,
    type: item.type === 'PADRE' ? 'padre' : item.type === 'DIACONO' ? 'diacono' : 'coordenacao',
  } as Person
}

export async function savePerson(input: any) {
  const payload = {
    name: input.name,
    slug: input.slug,
    type: input.type === 'padre' ? 'PADRE' : input.type === 'diacono' ? 'DIACONO' : 'COORDENADOR',
    roleTitle: input.role,
    bio: input.bio,
    quote: input.quote,
    ministry: input.ministry,
    attendance: input.attendance,
    photoId: input.photoId ?? null,
    featured: true,
    active: true,
  }
  if (input.id) return apiRequest(`/api/people/${input.id}`, { method: 'PUT', json: payload })
  return apiRequest('/api/people', { method: 'POST', json: payload })
}

export async function deletePerson(id: string) {
  await apiRequest(`/api/people/${id}`, { method: 'DELETE' })
}

export async function getDashboardStats() {
  const data = await apiRequest<any>('/api/dashboard')
  return {
    publishedNews: data.cards.publishedNews,
    totalNews: data.cards.publishedNews,
    activeNotices: data.cards.activeNotices,
    upcomingMasses: data.cards.upcomingMasses,
    upcomingEvents: data.cards.eventsThisMonth,
    totalEvents: data.cards.eventsThisMonth,
    prayerRequests: data.cards.prayerRequests,
    messages: 0,
    recentNews: data.recentNews,
    upcomingEventsList: data.upcomingEventsList ?? data.upcomingEvents,
    activities: data.activities,
    galleryPhotos: data.cards.galleryPhotos,
    pastorals: data.cards.pastorals ?? 0,
  }
}

export type AdminNotificationAlert = {
  id: string
  type: 'prayer' | 'message'
  title: string
  createdAt: string
  href: string
}

export type AdminActivityItem = {
  id: string
  action: string
  entity: string
  createdAt: string
  user?: { name?: string }
}

export async function getNotifications() {
  const data = await apiRequest<{
    data: { activities: AdminActivityItem[]; alerts: AdminNotificationAlert[] }
  }>('/api/notifications')
  return data.data
}
