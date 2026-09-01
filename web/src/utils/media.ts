import { mediaUrl } from '@/lib/api-client'
import type { MediaItem } from '@/services/mediaService'

export function mapMediaItem(item: MediaItem): MediaItem {
  return {
    ...item,
    url: mediaUrl(item.url),
    thumbnailUrl: mediaUrl(item.thumbnailUrl),
  }
}

/** URL da imagem com cache-bust para atualizar preview após upload/exclusão. */
export function mediaPreviewSrc(item: Pick<MediaItem, 'id' | 'url' | 'thumbnailUrl'>, thumb = true) {
  const base = thumb ? item.thumbnailUrl || item.url : item.url
  if (!base) return ''
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}v=${encodeURIComponent(item.id)}`
}
