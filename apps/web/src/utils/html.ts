export function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Converte texto legado (com quebras de linha) em HTML seguro para exibição. */
export function toDisplayHtml(value: string) {
  const raw = value ?? ''
  if (!raw.trim()) return ''
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw

  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('')
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export function progressPercent(current: number, goal: number) {
  if (!goal || goal <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((current / goal) * 100)))
}
