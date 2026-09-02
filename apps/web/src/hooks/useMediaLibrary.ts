import { deleteMedia, listMedia, uploadMedia, type MediaItem } from '@/services/mediaService'
import { mapMediaItem } from '@/utils/media'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useMediaLibrary(options?: { enabled?: boolean; search?: string }) {
  const enabled = options?.enabled ?? true
  const search = options?.search ?? ''
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const requestId = useRef(0)

  const load = useCallback(async (searchTerm = search) => {
    const current = ++requestId.current
    setLoading(true)
    try {
      const result = await listMedia({ search: searchTerm || undefined })
      if (current !== requestId.current) return
      setItems(result.data)
    } finally {
      if (current === requestId.current) setLoading(false)
    }
  }, [search])

  useEffect(() => {
    if (!enabled) return
    void load(search)
  }, [enabled, load, search])

  const upload = useCallback(async (file: File, folder = 'general') => {
    setUploading(true)
    try {
      const media = mapMediaItem(await uploadMedia(file, folder))
      setItems((current) => {
        const without = current.filter((item) => item.id !== media.id)
        return [media, ...without]
      })
      return media
    } finally {
      setUploading(false)
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    setDeletingId(id)
    const previous = items
    setItems((current) => current.filter((item) => item.id !== id))
    try {
      await deleteMedia(id)
    } catch (error) {
      setItems(previous)
      throw error
    } finally {
      setDeletingId(null)
    }
  }, [items])

  return {
    items,
    loading,
    uploading,
    deletingId,
    load,
    upload,
    remove,
    setItems,
  }
}
