import type { EventType, Prisma } from '@prisma/client'
import { paginated, parsePagination, slugify } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { prisma } from '../../lib/prisma.js'
import type { EventInput, EventUpdate } from './events.schema.js'
import * as eventsRepository from './events.repository.js'

async function uniqueEventSlug(base: string, excludeId?: string) {
  let slug = slugify(base)
  if (!slug) slug = 'evento'
  let suffix = 0
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const existing = await prisma.event.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) return candidate
    suffix += 1
  }
}

function mapEvent(item: any) {
  return { ...item, imageUrl: item.image?.url ?? null, imageThumbUrl: item.image?.thumbnailUrl ?? null }
}

export async function listEvents(query: Record<string, unknown>, hasAuthorization: boolean) {
  const { page, limit, skip } = parsePagination(query)
  const where: Prisma.EventWhereInput = {}
  if (query.public === 'true' || !hasAuthorization) where.active = true
  if (query.type) where.type = String(query.type) as EventType
  if (query.from || query.to) {
    where.startsAt = {}
    if (query.from) where.startsAt.gte = new Date(String(query.from))
    if (query.to) where.startsAt.lte = new Date(String(query.to))
  }
  if (query.search) where.title = { contains: String(query.search), mode: 'insensitive' }
  const [total, rows] = await Promise.all([
    eventsRepository.countEvents(where),
    eventsRepository.findEvents({ where, skip, take: limit }),
  ])
  return paginated(rows.map(mapEvent), total, page, limit)
}

export async function createEvent(data: EventInput, userId: string) {
  const item = await eventsRepository.createEvent({
    ...data,
    slug: await uniqueEventSlug(data.title),
    externalUrl: data.externalUrl || null,
    startsAt: new Date(data.startsAt),
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
  })
  await logActivity({ userId, action: 'create', entity: 'event', entityId: item.id })
  return mapEvent(item)
}

export async function updateEvent(id: string, data: EventUpdate, userId: string) {
  const item = await eventsRepository.updateEvent(id, {
    ...data,
    externalUrl: data.externalUrl === '' ? null : data.externalUrl,
    startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
    endsAt: data.endsAt === null ? null : data.endsAt ? new Date(data.endsAt) : undefined,
  })
  await logActivity({ userId, action: 'update', entity: 'event', entityId: id })
  return mapEvent(item)
}

export async function deleteEvent(id: string, userId: string) {
  await eventsRepository.deleteEvent(id)
  await logActivity({ userId, action: 'delete', entity: 'event', entityId: id })
  return { ok: true }
}
