/** Normaliza URLs de mídia para caminho relativo /uploads/... (funciona em dev e produção). */
export function toPublicMediaPath(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('/uploads/')) return url

  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith('/uploads/')) return parsed.pathname
  } catch {
    // caminho relativo sem barra inicial
  }

  const match = url.match(/\/uploads\/.+$/)
  return match ? match[0] : url
}

export function serializeMedia<T extends { url: string; thumbnailUrl?: string | null }>(item: T): T {
  return {
    ...item,
    url: toPublicMediaPath(item.url) ?? item.url,
    thumbnailUrl: toPublicMediaPath(item.thumbnailUrl) ?? item.thumbnailUrl,
  }
}
