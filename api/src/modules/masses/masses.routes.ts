import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { paginated, parsePagination } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { authorize } from '../../middlewares/authorize.js'

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

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

type MassRow = {
  id: string
  weekday: number | null
  date: Date | null
  time: string
  type: string
  location: string
  notes: string | null
  active: boolean
}

function parseLocalDate(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0, 0)
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nextOccurrence(weekday: number, time: string, from = new Date()) {
  const [h, m] = time.split(':').map(Number)
  const candidate = new Date(from)
  candidate.setSeconds(0, 0)
  candidate.setHours(h ?? 0, m ?? 0, 0, 0)
  const delta = (weekday - candidate.getDay() + 7) % 7
  candidate.setDate(candidate.getDate() + delta)
  if (candidate < from) candidate.setDate(candidate.getDate() + 7)
  return candidate
}

function getOccursAt(row: MassRow, from = new Date()) {
  if (row.date) return parseLocalDate(formatLocalDate(row.date), row.time)
  if (row.weekday !== null && row.weekday !== undefined) return nextOccurrence(row.weekday, row.time, from)
  return from
}

function decorate(schedules: MassRow[], from = new Date()) {
  const now = from
  const upcoming = schedules
    .filter((s) => s.active)
    .map((s) => ({ ...s, occursAt: getOccursAt(s, now) }))
    .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime())
  const nextId = upcoming.find((item) => item.occursAt >= now)?.id
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return upcoming.map((item) => ({
    ...item,
    weekdayLabel:
      item.weekday !== null && item.weekday !== undefined
        ? WEEKDAYS[item.weekday]
        : WEEKDAYS[item.occursAt.getDay()],
    date: formatLocalDate(item.occursAt),
    isToday: item.occursAt.toDateString() === now.toDateString(),
    isTomorrow: item.occursAt.toDateString() === tomorrow.toDateString(),
    isNext: item.id === nextId,
    recurring: !item.date,
  }))
}

function toDbDate(date?: string | null) {
  if (!date) return null
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0)
}

export async function massesRoutes(app: FastifyInstance) {
  app.get('/masses', async (request, reply) => {
    const query = request.query as Record<string, unknown>
    const { page, limit, skip } = parsePagination(query)
    const where: { active?: boolean; date?: { gte?: Date; lt?: Date } } =
      query.public === 'false' ? {} : { active: true }

    if (query.month && typeof query.month === 'string') {
      const [year, month] = query.month.split('-').map(Number)
      if (year && month) {
        where.date = {
          gte: new Date(year, month - 1, 1, 0, 0, 0, 0),
          lt: new Date(year, month, 1, 0, 0, 0, 0),
        }
      }
    }

    const [total, rows] = await Promise.all([
      prisma.massSchedule.count({ where }),
      prisma.massSchedule.findMany({
        where,
        orderBy: [{ date: 'asc' }, { weekday: 'asc' }, { time: 'asc' }],
        skip,
        take: limit,
      }),
    ])

    const decorated = decorate(rows)
    const sorted = query.month ? decorated : decorated.filter((item) => item.recurring || item.occursAt >= new Date())
    return reply.send(paginated(sorted, total, page, limit))
  })

  app.get('/masses/upcoming', async (request, reply) => {
    const limit = Math.min(50, Number((request.query as { limit?: string }).limit ?? 4) || 4)
    const rows = await prisma.massSchedule.findMany({ where: { active: true } })
    const now = new Date()
    return reply.send({
      data: decorate(rows)
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
