const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export type MassRow = {
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

export function formatLocalDate(date: Date) {
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

export function decorateMasses(schedules: MassRow[], from = new Date()) {
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

export function toDbDate(date?: string | null) {
  if (!date) return null
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0)
}

export { WEEKDAYS }
