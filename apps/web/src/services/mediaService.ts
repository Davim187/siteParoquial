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

export async function listMedia(params?: { search?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams({
    limit: String(params?.limit ?? 100),
    page: String(params?.page ?? 1),
  })
  if (params?.search) query.set('search', params.search)
  const result = await apiRequest<{
    data: MediaItem[]
    pagination?: { page: number; limit: number; total: number; totalPages: number }
  }>(`/api/media?${query}`)
  return {
    ...result,
    data: result.data.map(mapMediaItem),
  }
}

export async function listAllMedia(params?: { search?: string }) {
  const first = await listMedia({ ...params, page: 1, limit: 100 })
  const totalPages = first.pagination?.totalPages ?? 1
  if (totalPages <= 1) return first.data
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      listMedia({ ...params, page: index + 2, limit: 100 }),
    ),
  )
  return [first.data, ...rest.map((page) => page.data)].flat()
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
