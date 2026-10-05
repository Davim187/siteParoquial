import type { FeastProgramItem, PatronFeast } from '@/types'

const PROGRAM_TYPES = new Set<FeastProgramItem['type']>([
  'novena',
  'missa',
  'procissao',
  'evento',
  'show',
  'quermesse',
])

export function storedMediaPath(url: string) {
  if (!url) return ''
  const match = url.match(/\/uploads\/.+$/)
  return match ? match[0] : url
}

function normalizeProgramItem(raw: unknown, index: number): FeastProgramItem {
  const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const type = typeof item.type === 'string' && PROGRAM_TYPES.has(item.type as FeastProgramItem['type'])
    ? (item.type as FeastProgramItem['type'])
    : 'evento'
  return {
    id: typeof item.id === 'string' && item.id ? item.id : `programa-${index + 1}`,
    date: typeof item.date === 'string' ? item.date : '',
    time: typeof item.time === 'string' ? item.time : '',
    title: typeof item.title === 'string' ? item.title : '',
    description: typeof item.description === 'string' ? item.description : '',
    type,
  }
}

export function normalizeFeast(raw: unknown): PatronFeast {
  const feast = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const program = Array.isArray(feast.program) ? feast.program.map(normalizeProgramItem) : []
  return {
    enabled: Boolean(feast.enabled),
    title: typeof feast.title === 'string' ? feast.title : '',
    dateLabel: typeof feast.dateLabel === 'string' ? feast.dateLabel : '',
    description: typeof feast.description === 'string' ? feast.description : '',
    image: storedMediaPath(typeof feast.image === 'string' ? feast.image : ''),
    program,
  }
}

/** Mantém cada linha e cada parágrafo vazios do jeito que foram digitados. */
export function feastDescriptionLines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n')
}

export function feastForSave(feast: PatronFeast): PatronFeast {
  return normalizeFeast({
    ...feast,
    image: storedMediaPath(feast.image),
  })
}
