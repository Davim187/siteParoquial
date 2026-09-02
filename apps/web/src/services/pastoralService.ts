import { apiRequest, mediaUrl } from '@/lib/api-client'
import type { Pastoral } from '@/types'

function mapPastoral(item: any): Pastoral & { imageId?: string | null } {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    image:
      mediaUrl(item.imageUrl) ||
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
    imageId: item.imageId ?? null,
    responsible: item.responsible,
    contact: item.phone || item.email || '[CONTATO]',
    meetingTime: item.meetingTime || '[HORÁRIO]',
    location: item.location || '[LOCAL]',
    active: item.active,
  }
}

export async function listPastorals(options?: { includeInactive?: boolean }): Promise<Pastoral[]> {
  const params = options?.includeInactive ? '?all=true' : ''
  const result = await apiRequest<{ data: any[] }>(`/api/pastorals${params}`, {
    auth: Boolean(options?.includeInactive),
  })
  return result.data.map(mapPastoral)
}

export async function getPastoralBySlug(slug: string) {
  const item = await apiRequest<any>(`/api/pastorals/${slug}`, { auth: false })
  return mapPastoral(item)
}

export async function savePastoral(input: any) {
  const payload = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    imageId: input.imageId ?? null,
    responsible: input.responsible,
    phone: input.contact,
    meetingTime: input.meetingTime,
    location: input.location,
    active: input.active ?? true,
  }
  if (input.id) return apiRequest(`/api/pastorals/${input.id}`, { method: 'PUT', json: payload })
  return apiRequest('/api/pastorals', { method: 'POST', json: payload })
}

export async function deletePastoral(id: string) {
  await apiRequest(`/api/pastorals/${id}`, { method: 'DELETE' })
}
