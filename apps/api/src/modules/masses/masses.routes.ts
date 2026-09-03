import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { paginated, parsePagination } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { authorize } from '../../middlewares/authorize.js'
import { isPublicContentView } from '../../lib/access.js'

import { WEEKDAYS, decorateMasses, toDbDate } from './masses.helpers.js'

const updateMassSchema = z.object({
  weekday: z.number().int().min(0).max(6).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  type: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  notes: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

const massSchema = updateMassSchema
  .extend({
    time: z.string().regex(/^\d{2}:\d{2}$/),
    type: z.string().min(2),
    location: z.string().min(2),
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const hasDate = Boolean(data.date)
    const hasWeekday = data.weekday !== null && data.weekday !== undefined
    if (hasDate === hasWeekday) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe uma data específica ou um dia da semana fixo.',
        path: ['date'],
      })
    }
  })

export async function massesRoutes(app: FastifyInstance) {
  app.get('/masses', async (request, reply) => {
    const query = request.query as Record<string, unknown>
    const { page, limit, skip } = parsePagination(query)
    const isPublic = await isPublicContentView(request, 'MASSES_MANAGE')
    const where: { active?: boolean; date?: { gte?: Date; lt?: Date } } = isPublic ? { active: true } : {}

    if (query.month && typeof query.month === 'string') {
      const [year, month] = query.month.split('-').map(Number)
      if (year && month) {
        where.date = {
          gte: new Date(year, month - 1, 1, 0, 0, 0, 0),
          lt: new Date(year, month, 1, 0, 0, 0, 0),
        }
      }
    }

    const rows = await prisma.massSchedule.findMany({
      where,
      orderBy: [{ date: 'asc' }, { weekday: 'asc' }, { time: 'asc' }],
    })

    const decorated = decorateMasses(rows)
    const sorted = query.month
      ? decorated
      : decorated.filter((item) => item.recurring || item.occursAt >= new Date())
    const total = sorted.length
    const pageItems = sorted.slice(skip, skip + limit)
    return reply.send(paginated(pageItems, total, page, limit))
  })

  app.get('/masses/upcoming', async (request, reply) => {
    const limit = Math.min(50, Number((request.query as { limit?: string }).limit ?? 4) || 4)
    const rows = await prisma.massSchedule.findMany({ where: { active: true } })
    const now = new Date()
    return reply.send({
      data: decorateMasses(rows)
        .filter((item) => item.occursAt >= now)
        .slice(0, limit),
    })
  })

  app.get('/masses/weekly', async (_request, reply) => {
    const rows = await prisma.massSchedule.findMany({
      where: { active: true, date: null, weekday: { not: null } },
      orderBy: [{ weekday: 'asc' }, { time: 'asc' }],
    })
    return reply.send({
      data: rows.map((item) => ({
        ...item,
        weekdayLabel: WEEKDAYS[item.weekday ?? 0],
      })),
    })
  })

  app.post('/masses', { preHandler: [authorize('MASSES_MANAGE')] }, async (request, reply) => {
    const data = massSchema.parse(request.body)
    const item = await prisma.massSchedule.create({
      data: {
        weekday: data.date ? null : data.weekday ?? null,
        date: toDbDate(data.date),
        time: data.time,
        type: data.type,
        location: data.location,
        notes: data.notes ?? null,
        active: data.active,
      },
    })
    await logActivity({ userId: request.authUser!.id, action: 'create', entity: 'mass', entityId: item.id })
    return reply.status(201).send(item)
  })

  app.put('/masses/:id', { preHandler: [authorize('MASSES_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = updateMassSchema.parse(request.body)
    const item = await prisma.massSchedule.update({
      where: { id },
      data: {
        weekday: data.date === undefined ? undefined : data.date ? null : data.weekday ?? null,
        date: data.date === undefined ? undefined : toDbDate(data.date),
        time: data.time,
        type: data.type,
        location: data.location,
        notes: data.notes === undefined ? undefined : data.notes ?? null,
        active: data.active,
      },
    })
    await logActivity({ userId: request.authUser!.id, action: 'update', entity: 'mass', entityId: id })
    return reply.send(item)
  })

  app.delete('/masses/:id', { preHandler: [authorize('MASSES_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.massSchedule.delete({ where: { id } })
    await logActivity({ userId: request.authUser!.id, action: 'delete', entity: 'mass', entityId: id })
    return reply.send({ ok: true })
  })
}
