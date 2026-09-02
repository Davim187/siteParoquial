import { apiRequest } from '@/lib/api-client'
import type { Mass } from '@/types'

function mapUpcoming(item: any): Mass {
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

function buildMassesUrl(options?: { month?: string; admin?: boolean; limit?: number }) {
  const params = new URLSearchParams()
  params.set('limit', String(options?.limit ?? 100))
  if (options?.month) params.set('month', options.month)
  params.set('public', options?.admin ? 'false' : 'true')
  return `/api/masses?${params.toString()}`
}

export async function listMasses(options?: { month?: string; admin?: boolean; limit?: number }): Promise<Mass[]> {
  const result = await apiRequest<{ data: any[] }>(buildMassesUrl(options), { auth: Boolean(options?.admin) })
  return result.data.map(mapUpcoming)
}

export async function listUpcomingMasses(limit = 4) {
  const result = await apiRequest<{ data: any[] }>(`/api/masses/upcoming?limit=${limit}`, { auth: false })
  return result.data.map(mapUpcoming)
}

export async function saveMass(input: {
  id?: string
  date?: string
  weekday?: number | string
  time: string
  type: string
  location: string
  notes?: string
}) {
  const payload = input.date
    ? {
        date: input.date,
        time: input.time,
        type: input.type,
        location: input.location,
        notes: input.notes,
        active: true,
      }
    : {
        weekday:
          typeof input.weekday === 'number'
            ? input.weekday
            : new Date(`${input.date ?? new Date().toISOString().slice(0, 10)}T12:00:00`).getDay(),
        time: input.time,
        type: input.type,
        location: input.location,
        notes: input.notes,
        active: true,
      }

  if (input.id) return apiRequest(`/api/masses/${input.id}`, { method: 'PUT', json: payload })
  return apiRequest('/api/masses', { method: 'POST', json: payload })
}

export async function deleteMass(id: string) {
  await apiRequest(`/api/masses/${id}`, { method: 'DELETE' })
}
