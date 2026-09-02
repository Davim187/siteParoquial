import { apiRequest, mediaUrl, API_URL } from '@/lib/api-client'
import { mapMediaItem } from '@/utils/media'
import { prepareUploadImage } from '@/utils/prepareUploadImage'

export type MediaItem = {
  id: string
  originalName: string
  url: string
  thumbnailUrl?: string | null
  folder: string
  createdAt: string
}

export async function listMedia(params?: { search?: string; page?: number }) {
  const query = new URLSearchParams({ limit: '24', page: String(params?.page ?? 1) })
  if (params?.search) query.set('search', params.search)
  const result = await apiRequest<{ data: MediaItem[]; pagination: unknown }>(`/api/media?${query}`)
  return {
    ...result,
    data: result.data.map(mapMediaItem),
  }
}

export async function uploadMedia(file: File, folder = 'general') {
  const prepared = await prepareUploadImage(file)
  const form = new FormData()
  form.append('file', prepared)
  const token = localStorage.getItem('paroquia_access_token')
  const response = await fetch(`${API_URL}/api/media/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Falha no upload' }))
    throw new Error(err.message || 'Falha no upload')
  }
  const item = (await response.json()) as MediaItem
  return mapMediaItem(item)
}

export async function deleteMedia(id: string) {
  await apiRequest(`/api/media/${id}`, { method: 'DELETE' })
}

export { mediaUrl }
