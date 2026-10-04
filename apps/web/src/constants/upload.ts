export const MAX_UPLOAD_MB = 30

export const IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,image/x-nikon-nef,image/tiff,.heic,.heif,.nef'

const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
  'image/x-nikon-nef',
  'image/nef',
  'image/tiff',
  'image/x-tiff',
  'application/octet-stream',
]

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.nef']

export function isNefFile(file: { name?: string; type?: string }) {
  const name = (file.name ?? '').toLowerCase()
  const type = (file.type ?? '').toLowerCase()
  return name.endsWith('.nef') || type === 'image/x-nikon-nef' || type === 'image/nef'
}

export function validateImageUpload(file: File, maxMb = MAX_UPLOAD_MB): string | null {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  const validExt = IMAGE_EXTS.some((ext) => name.endsWith(ext))
  if (type && !type.startsWith('image/') && !IMAGE_TYPES.includes(type) && !validExt) {
    return `O arquivo ${file.name} não é um formato de imagem válido.`
  }
  if (!type && !validExt) {
    return `O arquivo ${file.name} não é um formato de imagem válido.`
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `O arquivo ${file.name} excede o limite de ${maxMb} MB.`
  }
  return null
}
