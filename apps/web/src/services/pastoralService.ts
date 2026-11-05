import { apiRequest } from '@/lib/api-client'
import { pastoralCover } from '@/constants/placeholders'
import { cardImageUrl, fullImageUrl } from '@/utils/media'
import type { Pastoral, PastoralKind } from '@/types'

function mapKind(value: unknown): PastoralKind {
  const raw = String(value ?? '').toLowerCase()
  if (raw === 'movimento') return 'movimento'
  if (raw === 'comissao') return 'comissao'
  return 'pastoral'
}

function mapPastoral(
  item: any,
  image: 'card' | 'full' = 'card',
): Pastoral & { imageId?: string | null } {
  const src =
    image === 'full'
      ? fullImageUrl(item.imageUrl, item.imageThumbUrl)
      : cardImageUrl(item.imageUrl, item.imageThumbUrl)
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    kind: mapKind(item.kind),
    description: item.description,
    image: pastoralCover(src || item.image),
    imageId: item.imageId ?? null,
    responsible: item.responsible,
    contact: item.phone || item.email || '[CONTATO]',
    meetingTime: item.meetingTime || '[HORÁRIO]',
    location: item.location || '[LOCAL]',
    active: item.active,
  }
}

export async function listPastorals(options?: { includeInactive?: boolean }): Promise<Pastoral[]> {
  const params = new URLSearchParams({ limit: '100' })
  if (options?.includeInactive) params.set('all', 'true')
  const result = await apiRequest<{ data: any[] }>(`/api/pastorals?${params}`, {
    auth: Boolean(options?.includeInactive),
  })
  return result.data.map((item) => mapPastoral(item))
}

export async function getPastoralBySlug(slug: string) {
  const item = await apiRequest<any>(`/api/pastorals/${slug}`, { auth: false })
  return mapPastoral(item, 'full')
}

export async function savePastoral(input: any) {
  const payload = {
    name: input.name,
    slug: input.slug,
    kind: input.kind ?? 'pastoral',
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
