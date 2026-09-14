const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const PARISH_TIMEZONE = 'America/Sao_Paulo'
const WEEKDAY_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export type MassRow = {
  id: string
  weekday: number | null
  date: Date | null
  time: string
  type: string
  location: string
  notes: string | null
  celebrant?: string | null
  active: boolean
}

type CivilParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: number
}

function zonedParts(date: Date, timeZone = PARISH_TIMEZONE): CivilParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '0'
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: WEEKDAY_SHORT[get('weekday')] ?? 0,
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function ymd(parts: Pick<CivilParts, 'year' | 'month' | 'day'>) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

function addCivilDays(year: number, month: number, day: number, days: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + days))
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() }
}

/** Converte data/hora civil de Brasília em um instante UTC real. */
function fromParishCivil(year: number, month: number, day: number, hour: number, minute: number) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0)
  const shown = zonedParts(new Date(utcGuess))
  const shownAsUtc = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute, shown.second)
  return new Date(utcGuess + (utcGuess - shownAsUtc))
}

function parseTime(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return { hour: hour ?? 0, minute: minute ?? 0 }
}

function nextOccurrence(weekday: number, time: string, from = new Date()) {
  const now = zonedParts(from)
  const { hour, minute } = parseTime(time)
  const delta = (weekday - now.weekday + 7) % 7
  let civil = addCivilDays(now.year, now.month, now.day, delta)
  let candidate = fromParishCivil(civil.year, civil.month, civil.day, hour, minute)
  if (candidate < from) {
    civil = addCivilDays(civil.year, civil.month, civil.day, 7)
    candidate = fromParishCivil(civil.year, civil.month, civil.day, hour, minute)
  }
  return candidate
}

function getOccursAt(row: MassRow, from = new Date()) {
  const { hour, minute } = parseTime(row.time)
  if (row.date) {
    const civil = zonedParts(row.date)
    return fromParishCivil(civil.year, civil.month, civil.day, hour, minute)
  }
  if (row.weekday !== null && row.weekday !== undefined) return nextOccurrence(row.weekday, row.time, from)
  return from
}

export function formatLocalDate(date: Date) {
  return ymd(zonedParts(date))
}

export function decorateMasses(schedules: MassRow[], from = new Date()) {
  const nowParts = zonedParts(from)
  const tomorrowParts = addCivilDays(nowParts.year, nowParts.month, nowParts.day, 1)
  const todayYmd = ymd(nowParts)
  const tomorrowYmd = ymd(tomorrowParts)

  const upcoming = schedules
    .filter((s) => s.active)
    .map((s) => ({ ...s, occursAt: getOccursAt(s, from) }))
    .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime())
  const nextId = upcoming.find((item) => item.occursAt >= from)?.id

  return upcoming.map((item) => {
    const occursParts = zonedParts(item.occursAt)
    const occursYmd = ymd(occursParts)
    return {
      ...item,
      weekdayLabel:
        item.weekday !== null && item.weekday !== undefined
          ? WEEKDAYS[item.weekday]
          : WEEKDAYS[occursParts.weekday],
      date: occursYmd,
      isToday: occursYmd === todayYmd,
      isTomorrow: occursYmd === tomorrowYmd,
      isNext: item.id === nextId,
      recurring: !item.date,
    }
  })
}

export function toDbDate(date?: string | null) {
  if (!date) return null
  return new Date(`${date}T12:00:00.000Z`)
}

export { WEEKDAYS, PARISH_TIMEZONE }
