import { apiRequest } from '@/lib/api-client'
import type { PrayerRequest } from '@/types'

export async function listPrayerRequests() {
  const result = await apiRequest<{ data: any[] }>('/api/prayers')
  return result.data.map(
    (item): PrayerRequest => ({
      id: item.id,
      name: item.name,
      email: item.email ?? undefined,
      request: item.request,
      anonymous: item.anonymous,
      createdAt: item.createdAt,
      status: item.status === 'NEW' ? 'new' : item.status === 'PRAYED' ? 'prayed' : 'archived',
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

export async function updatePrayerStatus(id: string, status: PrayerRequest['status']) {
  const map = { new: 'NEW', prayed: 'PRAYED', archived: 'ARCHIVED' } as const
  await apiRequest(`/api/prayers/${id}`, { method: 'PATCH', json: { status: map[status] } })
}

export async function deletePrayerRequest(_id: string) {
  return { ok: true }
}
