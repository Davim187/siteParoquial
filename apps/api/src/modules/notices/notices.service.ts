import type { NoticeCategory, Prisma } from '@prisma/client'
import { paginated, parsePagination } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import type { NoticeInput, NoticeUpdate } from './notices.schema.js'
import * as noticesRepository from './notices.repository.js'

function mapNotice(item: any) {
  return { ...item, imageUrl: item.image?.url ?? null, imageThumbUrl: item.image?.thumbnailUrl ?? null }
}

export async function listNotices(query: Record<string, unknown>, hasAuthorization: boolean) {
  const { page, limit, skip } = parsePagination(query)
  const now = new Date()
  const where: Prisma.NoticeWhereInput = {}
  const isPublic = !hasAuthorization || query.public === 'true'
  if (isPublic) {
    where.active = true
    where.startsAt = { lte: now }
    where.OR = [{ endsAt: null }, { endsAt: { gte: now } }]
  }
  if (query.category) where.category = String(query.category) as NoticeCategory
  if (query.search) {
    where.title = { contains: String(query.search), mode: 'insensitive' }
  }
  const [total, rows] = await Promise.all([
    noticesRepository.countNotices(where),
    noticesRepository.findNotices({ where, skip, take: limit }),
  ])
  return paginated(rows.map(mapNotice), total, page, limit)
}

export async function createNotice(data: NoticeInput, userId: string) {
  const item = await noticesRepository.createNotice({
    ...data,
    startsAt: new Date(data.startsAt),
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
  })
  await logActivity({ userId, action: 'create', entity: 'notice', entityId: item.id })
  return mapNotice(item)
}

export async function updateNotice(id: string, data: NoticeUpdate, userId: string) {
  const item = await noticesRepository.updateNotice(id, {
    ...data,
    startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
    endsAt: data.endsAt === null ? null : data.endsAt ? new Date(data.endsAt) : undefined,
  })
  await logActivity({ userId, action: 'update', entity: 'notice', entityId: id })
  return mapNotice(item)
}

export async function deleteNotice(id: string, userId: string) {
  await noticesRepository.deleteNotice(id)
  await logActivity({ userId, action: 'delete', entity: 'notice', entityId: id })
  return { ok: true }
}

export async function listFeaturedNotices() {
  const items = await noticesRepository.findFeaturedNotices(new Date())
  return { data: items.map(mapNotice) }
}
