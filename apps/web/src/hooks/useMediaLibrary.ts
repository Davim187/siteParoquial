import {
  useAdminMediaQuery,
  useDeleteMediaMutation,
  useUploadMediaMutation,
} from '@/hooks/queries/useAdminAccessQueries'

export function useMediaLibrary(options?: { enabled?: boolean; search?: string }) {
  const enabled = options?.enabled ?? true
  const search = options?.search ?? ''
  const query = useAdminMediaQuery(search, enabled)
  const uploadMutation = useUploadMediaMutation()
  const deleteMutation = useDeleteMediaMutation()

  return {
    items: query.data ?? [],
    loading: enabled && query.isLoading && !query.data,
    uploading: uploadMutation.isPending,
    deletingId: deleteMutation.isPending
      ? ((deleteMutation.variables as string | undefined) ?? null)
      : null,
    load: async (_searchTerm?: string) => {
      await query.refetch()
    },
    upload: async (file: File, folder = 'general') => uploadMutation.mutateAsync({ file, folder }),
    remove: async (id: string) => {
      await deleteMutation.mutateAsync(id)
    },
  }
}
