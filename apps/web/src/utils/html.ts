export function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export function progressPercent(current: number, goal: number) {
  if (!goal || goal <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((current / goal) * 100)))
}
