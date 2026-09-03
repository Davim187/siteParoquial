const FALLBACK_QUERY = 'Paróquia Nossa Senhora das Graças Parque Santa Maria'

/** Extrai só a URL se colaram o iframe inteiro do Google Maps. */
export function cleanMapsUrl(raw: string | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim().replace(/&amp;/g, '&')

  const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i)
  if (srcMatch) return srcMatch[1].trim()

  const embedMatch = trimmed.match(/https?:\/\/(?:www\.)?google\.com\/maps\/embed\?[^"'\s>]+/i)
  if (embedMatch) return embedMatch[0]

  const httpMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/)
  if (httpMatch) return httpMatch[0].replace(/["']$/, '')

  return trimmed
}

function embedFromQuery(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=pt-BR&z=16&output=embed`
}

/** URL para o src do iframe (Google exige Embed API dentro de iframe). */
export function mapsEmbedSrc(mapsUrl: string | undefined, address: string | undefined) {
  const url = cleanMapsUrl(mapsUrl)
  const fallback = address?.trim() || FALLBACK_QUERY

  if (!url) return embedFromQuery(fallback)

  if (/\/maps\/embed(\?|\/)/.test(url) || /[?&]output=embed\b/.test(url)) {
    return url
  }

  try {
    const parsed = new URL(url)
    const query = parsed.searchParams.get('query') || parsed.searchParams.get('q')
    if (query) return embedFromQuery(query)

    const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/)
    if (placeMatch) return embedFromQuery(decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')))

    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (coordMatch) return embedFromQuery(`${coordMatch[1]},${coordMatch[2]}`)
  } catch {
    return embedFromQuery(fallback)
  }

  return embedFromQuery(fallback)
}

/** Link para abrir o Google Maps numa aba (não usar URL de embed). */
export function mapsOpenUrl(mapsUrl: string | undefined, address: string | undefined) {
  const url = cleanMapsUrl(mapsUrl)
  const fallback = address?.trim() || FALLBACK_QUERY
  const search = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallback)}`

  if (!url) return search
  if (/\/maps\/embed(\?|\/)/.test(url) || /[?&]output=embed\b/.test(url)) {
    return search
  }
  return url
}
