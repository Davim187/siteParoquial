import { AppError } from './http.js'

export const ALLOWED_UPLOAD_FOLDERS = new Set([
  'general',
  'gallery',
  'news',
  'notices',
  'events',
  'pastorals',
  'people',
  'settings',
  'sacraments',
])

export function sanitizeUploadFolder(folder: string): string {
  const normalized = folder.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
  if (!normalized || normalized.includes('..') || !ALLOWED_UPLOAD_FOLDERS.has(normalized)) {
    throw new AppError(400, 'Pasta de upload inválida.')
  }
  return normalized
}
