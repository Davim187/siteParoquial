import { toPublicMediaPath } from '../../lib/media-url.js'

export function withImage(item: any) {
  const imageUrl = toPublicMediaPath(item.image?.url ?? item.photo?.url ?? null)
  const imageThumbUrl = toPublicMediaPath(item.image?.thumbnailUrl ?? item.photo?.thumbnailUrl ?? null)
  return {
    ...item,
    imageUrl,
    imageThumbUrl,
  }
}
