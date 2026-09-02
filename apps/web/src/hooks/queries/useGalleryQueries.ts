import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import {
  bulkUploadPhotos,
  createAlbum,
  deleteAlbum,
  deleteAlbumPhoto,
  getAlbumBySlug,
  listAlbums,
  setAlbumPublished,
  updateAlbum,
  type AlbumInput,
} from '@/services/galleryService'

export function useGalleryAlbumsQuery(params?: { all?: boolean; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.gallery.albums(params),
    queryFn: () => listAlbums(params),
    staleTime: STALE_TIME.gallery,
    placeholderData: (previous) => previous,
  })
}

export function useGalleryAlbumQuery(slug: string, params?: { all?: boolean }) {
  return useQuery({
    queryKey: queryKeys.gallery.album(slug, params),
    queryFn: () => getAlbumBySlug(slug, params),
    staleTime: STALE_TIME.gallery,
    enabled: Boolean(slug),
    placeholderData: (previous) => previous,
  })
}

export function useCreateAlbumMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: AlbumInput) => createAlbum(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

export function useUpdateAlbumMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AlbumInput> }) => updateAlbum(id, input),
    onSuccess: (album) => {
      void client.invalidateQueries({ queryKey: ['gallery'] })
      void client.setQueryData(queryKeys.gallery.album(album.slug, { all: true }), album)
    },
  })
}

export function usePublishAlbumMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setAlbumPublished(id, active),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

export function useDeleteAlbumMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAlbum(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

export function useBulkUploadPhotosMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      albumId,
      files,
      onProgress,
    }: {
      albumId: string
      files: File[]
      onProgress?: (done: number, total: number) => void
    }) => bulkUploadPhotos(albumId, files, onProgress),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

export function useDeleteAlbumPhotoMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: string; photoId: string }) =>
      deleteAlbumPhoto(albumId, photoId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}
