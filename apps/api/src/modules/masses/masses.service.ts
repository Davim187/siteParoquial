import { paginated, parsePagination } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import type { MassInput, MassUpdate } from './masses.schema.js'
import * as massesRepository from './masses.repository.js'

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

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

export async function listMasses(query: Record<string, unknown>) {
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
    massesRepository.countMasses(where),
    massesRepository.findMasses({ where, skip, take: limit }),
  ])

  const decorated = decorate(rows)
  const sorted = query.month ? decorated : decorated.filter((item) => item.recurring || item.occursAt >= new Date())
  return paginated(sorted, total, page, limit)
}

export async function listUpcoming(limitInput?: string) {
  const limit = Math.min(50, Number(limitInput ?? 4) || 4)
  const rows = await massesRepository.findActiveMasses()
  const now = new Date()
  return {
    data: decorate(rows)
      .filter((item) => item.occursAt >= now)
      .slice(0, limit),
  }
}

export async function listWeekly() {
  const rows = await massesRepository.findWeeklyMasses()
  return {
    data: rows.map((item) => ({
      ...item,
      weekdayLabel: WEEKDAYS[item.weekday ?? 0],
    })),
  }
}

export async function createMass(data: MassInput, userId: string) {
  const item = await massesRepository.createMass({
    weekday: data.date ? null : data.weekday ?? null,
    date: toDbDate(data.date),
    time: data.time,
    type: data.type,
    location: data.location,
    notes: data.notes ?? null,
    active: data.active,
  })
  await logActivity({ userId, action: 'create', entity: 'mass', entityId: item.id })
  return item
}

export async function updateMass(id: string, data: MassUpdate, userId: string) {
  const item = await massesRepository.updateMass(id, {
    weekday: data.date === undefined ? undefined : data.date ? null : data.weekday ?? null,
    date: data.date === undefined ? undefined : toDbDate(data.date),
    time: data.time,
    type: data.type,
    location: data.location,
    notes: data.notes === undefined ? undefined : data.notes ?? null,
    active: data.active,
  })
  await logActivity({ userId, action: 'update', entity: 'mass', entityId: id })
  return item
}

export async function deleteMass(id: string, userId: string) {
  await massesRepository.deleteMass(id)
  await logActivity({ userId, action: 'delete', entity: 'mass', entityId: id })
  return { ok: true }
}
