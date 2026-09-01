import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { unlink, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import sharp from 'sharp'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error pacote sem tipos
import heicConvert from 'heic-convert'

const execFileAsync = promisify(execFile)

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

/** Detecta HEIC/HEIF pelo conteúdo (iPhone às vezes envia MIME errado). */
function isHeicBuffer(buffer: Buffer) {
  if (buffer.length < 12) return false
  const brand = buffer.subarray(4, 12).toString('latin1').toLowerCase()
  return /heic|heif|mif1|msf1|hevc|hevx/.test(brand)
}

function isHeifProcessingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /heif|heic|compression format has not been built|bad seek/i.test(message)
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

async function convertHeicWithWasm(buffer: Buffer) {
  const output = await heicConvert({
    buffer: toArrayBuffer(buffer),
    format: 'JPEG',
    quality: 0.92,
  })
  const jpeg = Buffer.from(output)
  await sharp(jpeg).metadata()
  return jpeg
}

async function convertHeicWithMagick(buffer: Buffer) {
  const id = randomUUID()
  const input = path.join(tmpdir(), `${id}.heic`)
  const output = path.join(tmpdir(), `${id}.jpg`)

  try {
    await writeFile(input, buffer)
    const commands = [
      ['magick', [input, '-quality', '92', output]],
      ['convert', [input, '-quality', '92', output]],
      ['heif-convert', [input, output]],
    ] as const

    let lastError: unknown
    for (const [cmd, args] of commands) {
      try {
        await execFileAsync(cmd, args)
        const jpeg = await readFile(output)
        await sharp(jpeg).metadata()
        return jpeg
      } catch (error) {
        lastError = error
      }
    }
    throw lastError ?? new Error('sem conversor HEIC')
  } finally {
    await unlink(input).catch(() => undefined)
    await unlink(output).catch(() => undefined)
  }
}

async function convertHeicToJpeg(buffer: Buffer) {
  const attempts: Array<{ name: string; run: () => Promise<Buffer> }> = [
    { name: 'wasm', run: () => convertHeicWithWasm(buffer) },
    { name: 'imagemagick', run: () => convertHeicWithMagick(buffer) },
  ]

  const errors: string[] = []
  for (const attempt of attempts) {
    try {
      return await attempt.run()
    } catch (error) {
      errors.push(
        `${attempt.name}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  throw new Error(
    'Não foi possível converter HEIC/HEIF. Salve a foto como JPG (Ajustes > Câmera > Formatos > Mais Compatível) ou envie PNG/JPG.',
  )
}

export async function normalizeUploadImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<Buffer> {
  if (isHeicSource(mimeType, originalName) || isHeicBuffer(buffer)) {
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
