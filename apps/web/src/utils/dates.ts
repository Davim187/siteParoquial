const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const MONTHS_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export function parseDate(isoDate: string, time = '00:00') {
  const [hours, minutes] = time.split(':').map(Number)
  const normalized = isoDate.includes('T') ? isoDate.slice(0, 10) : isoDate

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
    const [day, month, year] = normalized.split('/').map(Number)
    return new Date(year, month - 1, day, hours ?? 0, minutes ?? 0, 0, 0)
  }

  const [year, month, day] = normalized.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0, 0, 0)
}

export function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function weekdayName(isoDate: string) {
  return WEEKDAYS[parseDate(isoDate).getDay()] ?? ''
}

export function monthName(isoDate: string, short = false) {
  const month = parseDate(isoDate).getMonth()
  return (short ? MONTHS_SHORT : MONTHS)[month] ?? ''
}

export function dayNumber(isoDate: string) {
  return parseDate(isoDate).getDate()
}

export function formatLongDate(isoDate: string) {
  const date = parseDate(isoDate)
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`
}

export function formatShortDate(isoDate: string) {
  if (!isoDate) return '—'
  const normalized = isoDate.includes('T') ? isoDate.slice(0, 10) : isoDate
  const date = parseDate(normalized)
  if (Number.isNaN(date.getTime())) return '—'
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

/** Alias para exibição em dd/mm/aaaa */
export const formatDate = formatShortDate

export function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(isoDate: string, days: number) {
  const date = parseDate(isoDate)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}
