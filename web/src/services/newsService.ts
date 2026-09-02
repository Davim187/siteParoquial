import { apiRequest, mediaUrl } from '@/lib/api-client'
import type { NewsArticle } from '@/types'

type ApiNews = {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  excerpt: string
  content: string
  coverUrl?: string | null
  authorName?: string | null
  categoryName?: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt?: string | null
  createdAt: string
  featured: boolean
  coverMediaId?: string | null
  categoryId?: string | null
}

function mapNews(item: ApiNews): NewsArticle & { categoryId?: string | null; coverMediaId?: string | null } {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle ?? undefined,
    excerpt: item.excerpt,
    content: item.content,
    author: item.authorName ?? '[EQUIPE DE COMUNICAÇÃO]',
    date: (item.publishedAt ?? item.createdAt).slice(0, 10),
    image: mediaUrl(item.coverUrl) || 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=1200&q=80',
    category: item.categoryName ?? 'Comunidade',
    categoryId: item.categoryId ?? null,
    coverMediaId: item.coverMediaId ?? null,
    status: item.status === 'PUBLISHED' ? 'published' : item.status === 'ARCHIVED' ? 'archived' : 'draft',
  }
}

export async function listNews(options?: { includeDrafts?: boolean; search?: string; status?: string; page?: number }): Promise<NewsArticle[]> {
  const params = new URLSearchParams()
  if (options?.page) params.set('page', String(options.page))
  if (options?.search) params.set('search', options.search)
  if (options?.status) params.set('status', options.status)
  params.set('limit', '50')
  const result = await apiRequest<{ data: ApiNews[] }>(`/api/news?${params}`, {
    auth: Boolean(options?.includeDrafts),
  })
  const items = result.data.map(mapNews)
  if (options?.includeDrafts) return items
  return items.filter((item) => item.status === 'published')
}

export async function getNewsBySlug(slug: string) {
  const item = await apiRequest<ApiNews>(`/api/news/${slug}`, { auth: false })
  return mapNews(item)
}

export async function getRelatedNews(article: NewsArticle) {
  const all = await listNews()
  return all.filter((item) => item.category === article.category && item.id !== article.id).slice(0, 3)
}

export async function saveNews(input: Partial<NewsArticle> & { title: string; excerpt: string; content: string; coverMediaId?: string | null; categoryId?: string | null }) {
  const payload = {
    title: input.title,
    subtitle: input.subtitle,
    excerpt: input.excerpt,
    content: input.content,
    coverMediaId: input.coverMediaId ?? null,
    categoryId: input.categoryId ?? null,
    status: input.status === 'published' ? 'PUBLISHED' : input.status === 'archived' ? 'ARCHIVED' : 'DRAFT',
    featured: false,
  }
  if (input.id) {
    return mapNews(await apiRequest<ApiNews>(`/api/news/${input.id}`, { method: 'PUT', json: payload }))
  }
  return mapNews(await apiRequest<ApiNews>('/api/news', { method: 'POST', json: payload }))
}

export async function deleteNews(id: string) {
  await apiRequest(`/api/news/${id}`, { method: 'DELETE' })
}

export async function setNewsStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
  return mapNews(await apiRequest<ApiNews>(`/api/news/${id}/status`, { method: 'PATCH', json: { status } }))
}

export async function duplicateNews(id: string) {
  return mapNews(await apiRequest<ApiNews>(`/api/news/${id}/duplicate`, { method: 'POST' }))
}

export async function listNewsCategories() {
  return apiRequest<{ data: Array<{ id: string; name: string; slug: string }> }>('/api/news/categories', { auth: false })
}

export async function getAdminNews(id: string) {
  return apiRequest<ApiNews>(`/api/admin/news/${id}`)
}
