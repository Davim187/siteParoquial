import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { NoticeCategory, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError, paginated, parsePagination } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { authorize } from '../../middlewares/authorize.js'

const noticeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.enum(['IMPORTANTE', 'COMUNICADO', 'LITURGIA', 'EVENTO', 'URGENTE']),
  priority: z.number().int().default(0),
  imageId: z.string().optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional().nullable(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
})

function mapNotice(item: any) {
  return { ...item, imageUrl: item.image?.url ?? null, imageThumbUrl: item.image?.thumbnailUrl ?? null }
}

export async function noticesRoutes(app: FastifyInstance) {
  app.get('/notices', async (request, reply) => {
    const query = request.query as Record<string, unknown>
    const { page, limit, skip } = parsePagination(query)
    const now = new Date()
    const where: Prisma.NoticeWhereInput = {}
    const isPublic = !request.headers.authorization || query.public === 'true'
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
      prisma.notice.count({ where }),
      prisma.notice.findMany({
        where,
        include: { image: true },
        orderBy: [{ featured: 'desc' }, { priority: 'desc' }, { startsAt: 'desc' }],
        skip,
        take: limit,
      }),
    ])
    return reply.send(paginated(rows.map(mapNotice), total, page, limit))
  })

  app.post('/notices', { preHandler: [authorize('NOTICES_MANAGE')] }, async (request, reply) => {
    const data = noticeSchema.parse(request.body)
    const item = await prisma.notice.create({
      data: {
        ...data,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
      include: { image: true },
    })
    await logActivity({ userId: request.authUser!.id, action: 'create', entity: 'notice', entityId: item.id })
    return reply.status(201).send(mapNotice(item))
  })

  app.put('/notices/:id', { preHandler: [authorize('NOTICES_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = noticeSchema.partial().parse(request.body)
    const item = await prisma.notice.update({
      where: { id },
      data: {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt === null ? null : data.endsAt ? new Date(data.endsAt) : undefined,
      },
      include: { image: true },
    })
    await logActivity({ userId: request.authUser!.id, action: 'update', entity: 'notice', entityId: id })
    return reply.send(mapNotice(item))
  })

  app.delete('/notices/:id', { preHandler: [authorize('NOTICES_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.notice.delete({ where: { id } })
    await logActivity({ userId: request.authUser!.id, action: 'delete', entity: 'notice', entityId: id })
    return reply.send({ ok: true })
  })

  app.get('/notices/featured', async (_request, reply) => {
    const now = new Date()
    const items = await prisma.notice.findMany({
      where: {
        active: true,
        featured: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      include: { image: true },
      orderBy: [{ priority: 'desc' }, { startsAt: 'desc' }],
    })
    return reply.send({ data: items.map(mapNotice) })
  })
}
