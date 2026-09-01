import path from 'node:path'
import sharp from 'sharp'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error pacote sem tipos
import heicConvert from 'heic-convert'

const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

const HEIC_MIMES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])

function isHeicSource(mimeType: string, originalName: string) {
  const mime = mimeType.toLowerCase()
  if (HEIC_MIMES.has(mime)) return true
  const ext = path.extname(originalName).toLowerCase()
  return ext === '.heic' || ext === '.heif'
}

function isHeifProcessingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /heif|heic|compression format has not been built|bad seek/i.test(message)
}

async function convertHeicToJpeg(buffer: Buffer) {
  const output = await heicConvert({
    buffer,
    format: 'JPEG',
    quality: 0.92,
  })
  return Buffer.from(output)
}

export async function normalizeUploadImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<Buffer> {
  if (isHeicSource(mimeType, originalName)) {
    return convertHeicToJpeg(buffer)
  }

  const normalizedMime = mimeType.toLowerCase()
  if (!ALLOWED.has(normalizedMime)) {
    throw new Error('Formato não permitido. Use JPG, PNG, WEBP ou HEIC (fotos do iPhone).')
  }

  try {
    await sharp(buffer).rotate().metadata()
    return buffer
  } catch (error) {
    if (!isHeifProcessingError(error)) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Não foi possível processar a imagem. Tente JPG ou PNG.',
      )
    }
    return convertHeicToJpeg(buffer)
  }
}
