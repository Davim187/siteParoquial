import { apiRequest } from '@/lib/api-client'
import { cardImageUrl, fullImageUrl } from '@/utils/media'
import { localPartsFromIso, normalizeTime, parseDate } from '@/utils/dates'
import type { EventCategory, ParishEvent } from '@/types'

const typeToCategory: Record<string, EventCategory> = {
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

const categoryToType: Record<EventCategory, string> = {
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

function mapEvent(item: any, variant: 'thumb' | 'full' = 'thumb'): ParishEvent {
  const start = localPartsFromIso(String(item.startsAt ?? ''))
  const end = item.endsAt ? localPartsFromIso(String(item.endsAt)) : null
  return {
    id: item.id,
    slug: item.slug || item.id,
    title: item.title,
    date: start.date,
    time: start.time,
    endTime: end?.time,
    location: item.location,
    description: item.description,
    image:
      (variant === 'full'
        ? fullImageUrl(item.imageUrl, item.imageThumbUrl)
        : cardImageUrl(item.imageUrl, item.imageThumbUrl)) || undefined,
    imageId: item.imageId ?? null,
    category: typeToCategory[item.type] ?? 'evento',
    responsible: item.responsible ?? undefined,
    externalUrl: item.externalUrl ?? undefined,
    gallery: (item.gallery ?? []).filter(Boolean),
    galleryMediaIds: item.galleryMediaIds ?? [],
  }
}

export async function listEvents(
  category?: EventCategory | 'todos',
  options?: { admin?: boolean },
): Promise<ParishEvent[]> {
  const params = new URLSearchParams({ limit: '50' })
  if (!options?.admin) params.set('public', 'true')
  if (category && category !== 'todos') {
    params.set('type', categoryToType[category] ?? 'OUTRO')
  }
  const result = await apiRequest<{ data: any[] }>(`/api/events?${params}`, {
    auth: Boolean(options?.admin),
  })
  return result.data.map((item) => mapEvent(item))
}

export async function listUpcomingEvents(limit = 6) {
  const events = await listEvents()
  return events.slice(0, limit)
}

export async function getEventBySlug(slug: string) {
  const item = await apiRequest<any>(`/api/events/${encodeURIComponent(slug)}`, { auth: false })
  return mapEvent(item, 'full')
}

export async function saveEvent(input: Omit<ParishEvent, 'id'> & { id?: string }) {
  const time = normalizeTime(input.time)
  const payload = {
    title: input.title,
    description: input.description,
    type: categoryToType[input.category] ?? 'EVENTO',
    startsAt: parseDate(input.date, time).toISOString(),
    endsAt: input.endTime ? parseDate(input.date, normalizeTime(input.endTime)).toISOString() : null,
    location: input.location,
    imageId: input.imageId ?? null,
    featured: false,
    active: true,
    responsible: input.responsible || null,
    externalUrl: input.externalUrl || null,
    galleryMediaIds: input.galleryMediaIds ?? [],
  }
  if (input.id) return mapEvent(await apiRequest<any>(`/api/events/${input.id}`, { method: 'PUT', json: payload }))
  return mapEvent(await apiRequest<any>('/api/events', { method: 'POST', json: payload }))
}

export async function deleteEvent(id: string) {
  await apiRequest(`/api/events/${id}`, { method: 'DELETE' })
}
