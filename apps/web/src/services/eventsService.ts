import { apiRequest, mediaUrl } from '@/lib/api-client'
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

export async function listEvents(
  category?: EventCategory | 'todos',
  options?: { admin?: boolean },
): Promise<ParishEvent[]> {
  const params = new URLSearchParams({ limit: '50' })
  if (!options?.admin) params.set('public', 'true')
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
  const result = await apiRequest<{ data: any[] }>(`/api/events?${params}`, {
    auth: Boolean(options?.admin),
  })
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
      category: typeToCategory[item.type] ?? 'evento',
      responsible: item.responsible ?? undefined,
      externalUrl: item.externalUrl ?? undefined,
    }),
  )
}

export async function listUpcomingEvents(limit = 6) {
  const events = await listEvents()
  return events.slice(0, limit)
}

export async function saveEvent(input: any) {
  const payload = {
    title: input.title,
    description: input.description,
    type: 'EVENTO',
    startsAt: new Date(`${input.date}T${input.time || '19:00'}:00`).toISOString(),
    endsAt: null,
    location: input.location,
    featured: false,
    active: true,
    responsible: input.responsible,
  }
  if (input.id) return apiRequest(`/api/events/${input.id}`, { method: 'PUT', json: payload })
  return apiRequest('/api/events', { method: 'POST', json: payload })
}

export async function deleteEvent(id: string) {
  await apiRequest(`/api/events/${id}`, { method: 'DELETE' })
}
