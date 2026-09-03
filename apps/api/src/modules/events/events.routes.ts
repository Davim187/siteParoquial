import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { EventType, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError, paginated, parsePagination } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { authorize } from '../../middlewares/authorize.js'
import { isPublicContentView } from '../../lib/access.js'

const eventSchema = z.object({
  title: z.string().min(3),
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
})

function mapEvent(item: any) {
  return { ...item, imageUrl: item.image?.url ?? null, imageThumbUrl: item.image?.thumbnailUrl ?? null }
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
        include: { image: { select: { url: true, thumbnailUrl: true } } },
        orderBy: { startsAt: 'asc' },
        skip,
        take: limit,
      }),
    ])
    return reply.send(paginated(rows.map(mapEvent), total, page, limit))
  })

  app.post('/events', { preHandler: [authorize('EVENTS_MANAGE')] }, async (request, reply) => {
    const data = eventSchema.parse(request.body)
    const item = await prisma.event.create({
      data: {
        ...data,
        externalUrl: data.externalUrl || null,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
      include: { image: true },
    })
    await logActivity({ userId: request.authUser!.id, action: 'create', entity: 'event', entityId: item.id })
    return reply.status(201).send(mapEvent(item))
  })

  app.put('/events/:id', { preHandler: [authorize('EVENTS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = eventSchema.partial().parse(request.body)
    const item = await prisma.event.update({
      where: { id },
      data: {
        ...data,
        externalUrl: data.externalUrl === '' ? null : data.externalUrl,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt === null ? null : data.endsAt ? new Date(data.endsAt) : undefined,
      },
      include: { image: true },
    })
    await logActivity({ userId: request.authUser!.id, action: 'update', entity: 'event', entityId: id })
    return reply.send(mapEvent(item))
  })

  app.delete('/events/:id', { preHandler: [authorize('EVENTS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.event.delete({ where: { id } })
    await logActivity({ userId: request.authUser!.id, action: 'delete', entity: 'event', entityId: id })
    return reply.send({ ok: true })
  })
}
