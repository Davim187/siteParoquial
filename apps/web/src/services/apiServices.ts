import { apiRequest, mediaUrl } from '@/lib/api-client'
import type { Mass, Notice, ParishEvent, ParishSettings, Pastoral, Person, Sacrament, GalleryItem } from '@/types'

export async function listNotices() {
  const result = await apiRequest<{ data: any[] }>('/api/notices?public=true&limit=50', { auth: false })
  return result.data.map(
    (item): Notice => ({
      id: item.id,
      title: item.title,
      description: item.description,
      date: item.startsAt.slice(0, 10),
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
    }),
  )
}

export async function getFeaturedNotices() {
  const result = await apiRequest<{ data: any[] }>('/api/notices/featured', { auth: false })
  if (result.data?.length) {
    return result.data.map(
      (item): Notice => ({
        id: item.id,
        title: item.title,
        description: item.description,
        date: item.startsAt.slice(0, 10),
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
      }),
    )
  }
  const list = await listNotices()
  return list.filter((item) => item.featured)
}

export async function getFeaturedNotice() {
  const notices = await getFeaturedNotices()
  return notices[0] ?? null
}

export async function listUpcomingMasses(limit = 4) {
  const result = await apiRequest<{ data: any[] }>(`/api/masses/upcoming?limit=${limit}`, { auth: false })
  return result.data.map(
    (item): Mass => ({
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
    }),
  )
}

export async function listMasses() {
  const result = await apiRequest<{ data: any[] }>('/api/masses/weekly', { auth: false })
  return result.data.map(
    (item): Mass => ({
      id: item.id,
      weekday: item.weekdayLabel,
      date: '',
      time: item.time,
      type: item.type,
      location: item.location,
      notes: item.notes ?? undefined,
    }),
  )
}

export async function listEvents(category?: string) {
  const params = new URLSearchParams({ public: 'true', limit: '50' })
  if (category && category !== 'todos') {
    const map: Record<string, string> = {
      missa: 'MISSA',
      adoracao: 'ADORACAO',
      confissao: 'CONFISSAO',
      evento: 'EVENTO',
      reuniao: 'REUNIAO',
      pastoral: 'PASTORAL',
      formacao: 'FORMACAO',
      festa: 'EVENTO',
      'celebracao-especial': 'CELEBRACAO',
    }
    params.set('type', map[category] ?? 'OUTRO')
  }
  const result = await apiRequest<{ data: any[] }>(`/api/events?${params}`, { auth: false })
  return result.data.map(
    (item): ParishEvent => ({
      id: item.id,
      title: item.title,
      date: item.startsAt.slice(0, 10),
      time: item.startsAt.slice(11, 16),
      endTime: item.endsAt ? item.endsAt.slice(11, 16) : undefined,
      location: item.location,
      description: item.description,
      image: mediaUrl(item.imageUrl) || undefined,
      category: 'evento',
      responsible: item.responsible ?? undefined,
      externalUrl: item.externalUrl ?? undefined,
    }),
  )
}

export async function listUpcomingEvents(limit = 6) {
  const events = await listEvents()
  return events.slice(0, limit)
}

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
    mapsUrl: s.mapsUrl,
    pixKey: s.pixKey,
    bankDetails: s.bankDetails,
    streamingUrl: s.streamingUrl,
    history: s.history,
    mission: s.mission,
    vision: s.vision,
    patroness: s.patroness,
  }
}

export async function getFeast() {
  const s = await apiRequest<any>('/api/settings', { auth: false })
  return s.feast
}

export async function listPeople() {
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
  const list = await listPeople()
  return list.find((p) => p.slug === item.slug) ?? list.find((p) => p.slug === slug)
}

export async function listPastorals() {
  const result = await apiRequest<{ data: any[] }>('/api/pastorals', { auth: false })
  return result.data.map(
    (item): Pastoral => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      image:
        mediaUrl(item.imageUrl) ||
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
      responsible: item.responsible,
      contact: item.phone || item.email || '[CONTATO]',
      meetingTime: item.meetingTime || '[HORÁRIO]',
      location: item.location || '[LOCAL]',
      active: item.active,
    }),
  )
}

export async function getPastoralBySlug(slug: string) {
  const item = await apiRequest<any>(`/api/pastorals/${slug}`, { auth: false })
  const list = await listPastorals()
  return list.find((p) => p.slug === item.slug)
}

export async function listSacraments() {
  const result = await apiRequest<{ data: any[] }>('/api/sacraments', { auth: false })
  return result.data.map(
    (item): Sacrament => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      summary: item.summary,
      whatItIs: item.whatItIs,
      whoCanReceive: item.whoCanReceive,
      howItWorks: item.howItWorks,
      documents: item.documents,
      howToRegister: item.howToRegister,
      secretaryContact: item.secretaryContact,
    }),
  )
}

export async function getSacramentBySlug(slug: string) {
  const item = await apiRequest<any>(`/api/sacraments/${slug}`, { auth: false })
  const list = await listSacraments()
  return list.find((s) => s.slug === item.slug)
}

export async function listGallery(category?: string) {
  const params = new URLSearchParams({ limit: '40' })
  if (category && category !== 'todas') {
    const map: Record<string, string> = {
      missas: 'MISSAS',
      eventos: 'EVENTOS',
      'festa-padroeira': 'FESTA_PADROEIRA',
      'semana-santa': 'SEMANA_SANTA',
      catequese: 'CATEQUESE',
      juventude: 'JUVENTUDE',
      pastorais: 'PASTORAIS',
      'acoes-sociais': 'ACOES_SOCIAIS',
    }
    params.set('category', map[category] ?? 'EVENTOS')
  }
  const result = await apiRequest<{ data: any[] }>(`/api/gallery?${params}`, { auth: false })
  return result.data.map(
    (item): GalleryItem => ({
      id: item.id,
      title: item.title,
      src: mediaUrl(item.src),
      alt: item.alt,
      category: 'eventos',
      date: item.date.slice(0, 10),
    }),
  )
}

export async function submitPrayerRequest(input: {
  name: string
  email?: string
  request: string
  anonymous: boolean
}) {
  return apiRequest('/api/prayers', { method: 'POST', auth: false, json: input })
}

export async function submitContactMessage(input: {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}) {
  return apiRequest('/api/contact', { method: 'POST', auth: false, json: input })
}

export async function getDashboardStats() {
  return apiRequest<any>('/api/dashboard')
}
