import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { apiRequest } from '@/lib/api-client'
import { deleteMedia, listAllMedia, uploadMedia, type MediaItem } from '@/services/mediaService'
import { mapMediaItem } from '@/utils/media'

export type AdminUserRow = {
  id: string
  name: string
  email: string
  active: boolean
  role: string
  roleName?: string
  lastLoginAt?: string | null
  overrides?: Array<{ code: string; granted: boolean }>
}

export type AdminRoleRow = {
  id: string
  code: string
  name: string
  description?: string | null
  permissions: string[]
  permissionDetails?: Array<{ code: string; name: string }>
  userCount: number
  isSystem?: boolean
}

export type AdminPermissionItem = { id: string; code: string; name: string }

export type AdminRoleOption = {
  code: string
  name: string
  permissions: string[]
}

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users.list,
    queryFn: async () => (await apiRequest<{ data: AdminUserRow[] }>('/api/users?limit=100')).data,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function useAdminRolesQuery() {
  return useQuery({
    queryKey: queryKeys.roles.list,
    queryFn: async () => (await apiRequest<{ data: AdminRoleRow[] }>('/api/roles')).data,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function useAdminRoleOptionsQuery() {
  return useQuery({
    queryKey: queryKeys.roles.options,
    queryFn: async () => (await apiRequest<{ data: AdminRoleOption[] }>('/api/roles')).data,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function useAdminPermissionsQuery() {
  return useQuery({
    queryKey: queryKeys.permissions,
    queryFn: async () => (await apiRequest<{ data: AdminPermissionItem[] }>('/api/permissions')).data,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function useAdminProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => (await apiRequest<{ data: any }>('/api/me/profile')).data,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function useAdminMediaQuery(search = '', enabled = true) {
  return useQuery({
    queryKey: queryKeys.media.list({ search }),
    queryFn: () => listAllMedia({ search: search || undefined }),
    enabled,
    staleTime: STALE_TIME.admin,
    placeholderData: (previous) => previous,
  })
}

export function useUploadMediaMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, folder = 'general' }: { file: File; folder?: string }) =>
      mapMediaItem(await uploadMedia(file, folder)),
    onSuccess: (media) => {
      client.setQueriesData<MediaItem[]>({ queryKey: queryKeys.media.all }, (old) => {
        if (!old) return [media]
        return [media, ...old.filter((item) => item.id !== media.id)]
      })
      void client.invalidateQueries({ queryKey: queryKeys.media.all })
    },
  })
}

export function useDeleteMediaMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: queryKeys.media.all })
      const previous = client.getQueriesData<MediaItem[]>({ queryKey: queryKeys.media.all })
      client.setQueriesData<MediaItem[]>({ queryKey: queryKeys.media.all }, (old) =>
        old ? old.filter((item) => item.id !== id) : old,
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      context?.previous?.forEach(([key, data]) => client.setQueryData(key, data))
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: queryKeys.media.all })
    },
  })
}

export function useInvalidateAdminAccessQueries() {
  const client = useQueryClient()
  return {
    users: () => client.invalidateQueries({ queryKey: queryKeys.users.all }),
    roles: () => client.invalidateQueries({ queryKey: queryKeys.roles.all }),
    permissions: () => client.invalidateQueries({ queryKey: queryKeys.permissions }),
    profile: () => client.invalidateQueries({ queryKey: queryKeys.profile }),
    media: () => client.invalidateQueries({ queryKey: queryKeys.media.all }),
  }
}
