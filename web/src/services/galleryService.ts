import { apiRequest, mediaUrl } from '@/lib/api-client'
import type { GalleryCategory, GalleryItem } from '@/types'

export async function listGallery(category?: GalleryCategory | 'todas') {
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
      category: category && category !== 'todas' ? category : 'eventos',
      date: String(item.date).slice(0, 10),
    }),
  )
}

export async function saveGalleryItem(input: any) {
  return apiRequest('/api/gallery', {
    method: 'POST',
    json: {
      title: input.title,
      alt: input.alt || input.title,
      category: 'EVENTOS',
      mediaId: input.mediaId,
    },
  })
}

export async function deleteGalleryItem(id: string) {
  await apiRequest(`/api/gallery/${id}`, { method: 'DELETE' })
}
