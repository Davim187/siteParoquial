import { apiRequest, mediaUrl } from '@/lib/api-client'
import type { Notice } from '@/types'

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

export async function listNotices(options?: { includeDrafts?: boolean }): Promise<Notice[]> {
  const params = new URLSearchParams({ limit: '50' })
  if (!options?.includeDrafts) params.set('public', 'true')
  const result = await apiRequest<{ data: any[] }>(`/api/notices?${params}`, {
    auth: Boolean(options?.includeDrafts),
  })
  return result.data.map(mapNotice)
}

export async function getFeaturedNotices() {
  const result = await apiRequest<{ data: any[] }>('/api/notices/featured', { auth: false })
  if (result.data?.length) return result.data.map(mapNotice)
  const list = await listNotices()
  return list.filter((item) => item.featured)
}

/** @deprecated Use getFeaturedNotices */
export async function getFeaturedNotice() {
  const notices = await getFeaturedNotices()
  return notices[0] ?? null
}

export async function saveNotice(input: any) {
  const payload = {
    title: input.title,
    description: input.description,
    category:
      input.category === 'urgente'
        ? 'URGENTE'
        : input.category === 'liturgico'
          ? 'LITURGIA'
          : input.category === 'evento'
            ? 'EVENTO'
            : input.category === 'informativo'
              ? 'IMPORTANTE'
              : 'COMUNICADO',
    featured: Boolean(input.featured),
    active: input.status !== 'draft',
    startsAt: new Date(input.date || Date.now()).toISOString(),
    endsAt: null,
    priority: 0,
  }
  if (input.id) {
    return mapNotice(await apiRequest(`/api/notices/${input.id}`, { method: 'PUT', json: payload }))
  }
  return mapNotice(await apiRequest('/api/notices', { method: 'POST', json: payload }))
}

export async function deleteNotice(id: string) {
  await apiRequest(`/api/notices/${id}`, { method: 'DELETE' })
}
