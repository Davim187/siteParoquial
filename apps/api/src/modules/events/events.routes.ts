import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { EventType, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError, paginated, parsePagination, slugify } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { authorize } from '../../middlewares/authorize.js'
import { isPublicContentView } from '../../lib/access.js'
import { toPublicMediaPath } from '../../lib/media-url.js'

const eventSchema = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  description: z.string().min(3),
  type: z.enum(['MISSA', 'CELEBRACAO', 'EVENTO', 'REUNIAO', 'FORMACAO', 'ADORACAO', 'CONFISSAO', 'PASTORAL', 'OUTRO']),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional().nullable(),
  location: z.string().min(2),
  imageId: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  responsible: z.string().optional().nullable(),
  externalUrl: z.string().url().optional().nullable().or(z.literal('')),
  galleryMediaIds: z.array(z.string()).optional(),
})

const eventInclude = {
  image: { select: { url: true, thumbnailUrl: true } },
  galleryImages: { include: { media: true }, orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.EventInclude

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

async function syncGallery(eventId: string, mediaIds?: string[]) {
  if (!mediaIds) return
  await prisma.eventImage.deleteMany({ where: { eventId } })
  if (mediaIds.length === 0) return
  await prisma.eventImage.createMany({
    data: mediaIds.map((mediaId, sortOrder) => ({ eventId, mediaId, sortOrder })),
  })
}

function mapEvent(item: {
  image?: { url: string; thumbnailUrl: string | null } | null
  galleryImages?: Array<{ mediaId: string; media?: { url?: string | null; thumbnailUrl?: string | null } | null }>
  [key: string]: unknown
}) {
  const gallery = item.galleryImages ?? []
  const { galleryImages: _galleryImages, ...rest } = item
  return {
    ...rest,
    imageUrl: toPublicMediaPath(item.image?.url ?? null),
    imageThumbUrl: toPublicMediaPath(item.image?.thumbnailUrl ?? null),
    gallery: gallery
      .map((entry) => toPublicMediaPath(entry.media?.url ?? null))
      .filter((src): src is string => Boolean(src)),
    galleryThumbUrls: gallery
      .map((entry) => toPublicMediaPath(entry.media?.thumbnailUrl ?? entry.media?.url ?? null))
      .filter((src): src is string => Boolean(src)),
    galleryMediaIds: gallery.map((entry) => entry.mediaId),
  }
}

export async function eventsRoutes(app: FastifyInstance) {
  app.get('/events', async (request, reply) => {
    const query = request.query as Record<string, unknown>
    const { page, limit, skip } = parsePagination(query)
    const where: Prisma.EventWhereInput = {}
    const isPublic = await isPublicContentView(request, 'EVENTS_MANAGE')
    if (isPublic) where.active = true
    if (query.type) where.type = String(query.type) as EventType
    if (query.from || query.to) {
      where.startsAt = {}
      if (query.from) where.startsAt.gte = new Date(String(query.from))
      if (query.to) where.startsAt.lte = new Date(String(query.to))
    }
    if (query.search) where.title = { contains: String(query.search), mode: 'insensitive' }
    const [total, rows] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: { startsAt: 'asc' },
        skip,
        take: limit,
      }),
    ])
    return reply.send(paginated(rows.map(mapEvent), total, page, limit))
  })

  app.get('/events/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const isPublic = await isPublicContentView(request, 'EVENTS_MANAGE')
    const item = await prisma.event.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        ...(isPublic ? { active: true } : {}),
      },
      include: eventInclude,
    })
    if (!item) throw new AppError(404, 'Evento não encontrado.')
    return reply.send(mapEvent(item))
  })

  app.post('/events', { preHandler: [authorize('EVENTS_MANAGE')] }, async (request, reply) => {
    const data = eventSchema.parse(request.body)
    const slug = await uniqueEventSlug(data.slug || data.title)
    const item = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        type: data.type,
        location: data.location,
        imageId: data.imageId ?? null,
        featured: data.featured,
        active: data.active,
        responsible: data.responsible ?? null,
        externalUrl: data.externalUrl || null,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
      include: eventInclude,
    })
    await syncGallery(item.id, data.galleryMediaIds)
    const saved = data.galleryMediaIds
      ? await prisma.event.findUniqueOrThrow({ where: { id: item.id }, include: eventInclude })
      : item
    await logActivity({ userId: request.authUser!.id, action: 'create', entity: 'event', entityId: item.id })
    return reply.status(201).send(mapEvent(saved))
  })

  app.put('/events/:id', { preHandler: [authorize('EVENTS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = eventSchema.partial().parse(request.body)
    const current = await prisma.event.findUnique({ where: { id } })
    if (!current) throw new AppError(404, 'Evento não encontrado.')
    const slug =
      data.slug !== undefined ? await uniqueEventSlug(data.slug || data.title || current.title, id) : undefined
    const item = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        description: data.description,
        type: data.type,
        location: data.location,
        imageId: data.imageId === undefined ? undefined : data.imageId ?? null,
        featured: data.featured,
        active: data.active,
        responsible: data.responsible === undefined ? undefined : data.responsible ?? null,
        externalUrl: data.externalUrl === undefined ? undefined : data.externalUrl || null,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt === null ? null : data.endsAt ? new Date(data.endsAt) : undefined,
      },
      include: eventInclude,
    })
    await syncGallery(id, data.galleryMediaIds)
    const saved = data.galleryMediaIds
      ? await prisma.event.findUniqueOrThrow({ where: { id }, include: eventInclude })
      : item
    await logActivity({ userId: request.authUser!.id, action: 'update', entity: 'event', entityId: id })
    return reply.send(mapEvent(saved))
  })

  app.delete('/events/:id', { preHandler: [authorize('EVENTS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.event.delete({ where: { id } })
    await logActivity({ userId: request.authUser!.id, action: 'delete', entity: 'event', entityId: id })
    return reply.send({ ok: true })
  })
}
