export interface StoredObject {
  fileName: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  size: number
  width?: number
  height?: number
}

export interface StorageService {
  upload(buffer: Buffer, originalName: string, mimeType: string, folder?: string): Promise<StoredObject>
  delete(fileName: string): Promise<void>
  getUrl(fileName: string): string
}
