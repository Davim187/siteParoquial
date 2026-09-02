import { createHash, randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { env } from '../config/env.js'
import { normalizeUploadImage } from './normalize-image.js'
import type { StorageService, StoredObject } from './types.js'

export class LocalStorageService implements StorageService {
  private root: string

  constructor() {
    this.root = path.resolve(process.cwd(), env.UPLOAD_DIR)
  }

  getUrl(fileName: string) {
    return `/uploads/${fileName}`
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string, folder = 'general'): Promise<StoredObject> {
    const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024
    if (buffer.byteLength > maxBytes) {
      throw new Error(`Arquivo excede o limite de ${env.MAX_UPLOAD_MB}MB.`)
    }

    const normalized = await normalizeUploadImage(buffer, mimeType, originalName)

    await mkdir(path.join(this.root, folder), { recursive: true })

    const hash = createHash('sha1').update(normalized).digest('hex').slice(0, 8)
    const base = `${Date.now()}-${randomUUID().slice(0, 8)}-${hash}`
    const fileName = `${folder}/${base}.webp`
    const thumbName = `${folder}/${base}-thumb.webp`

    const image = sharp(normalized).rotate()
    const meta = await image.metadata()
    const webp = await image.webp({ quality: 82 }).toBuffer()
    const thumb = await sharp(normalized)
      .rotate()
      .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer()

    await writeFile(path.join(this.root, fileName), webp)
    await writeFile(path.join(this.root, thumbName), thumb)

    return {
      fileName,
      url: this.getUrl(fileName),
      thumbnailUrl: this.getUrl(thumbName),
      mimeType: 'image/webp',
      size: webp.byteLength,
      width: meta.width,
      height: meta.height,
    }
  }

  async delete(fileName: string) {
    const full = path.join(this.root, fileName)
    const thumb = full.replace(/\.webp$/, '-thumb.webp')
    await unlink(full).catch(() => undefined)
    await unlink(thumb).catch(() => undefined)
  }
}

export function createStorageService(): StorageService {
  if (env.STORAGE_PROVIDER === 'local') return new LocalStorageService()
  // Preparado para S3 / R2 / Cloudinary sem reescrever o restante do sistema.
  return new LocalStorageService()
}
