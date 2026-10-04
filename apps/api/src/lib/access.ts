import type { FastifyRequest } from 'fastify'
import type { PermissionCode } from '@prisma/client'
import { AppError } from './http.js'
import { loadAuthUser } from '../middlewares/authorize.js'

export async function tryOptionalAuth(request: FastifyRequest): Promise<boolean> {
  if (!request.headers.authorization) return false
  try {
    await request.jwtVerify()
    request.authUser = await loadAuthUser(request.user.sub)
    return true
  } catch {
    return false
  }
}

export function hasPermission(request: FastifyRequest, permission: PermissionCode): boolean {
  const user = request.authUser
  if (!user) return false
  if (user.role === 'ADMIN') return true
  return user.permissions.includes(permission)
}

export function hasAnyPermission(request: FastifyRequest, ...required: PermissionCode[]): boolean {
  return required.some((perm) => hasPermission(request, perm))
}

export async function requirePermission(request: FastifyRequest, permission: PermissionCode): Promise<void> {
  await request.jwtVerify()
  request.authUser = await loadAuthUser(request.user.sub)
  if (!hasPermission(request, permission)) {
    throw new AppError(403, 'Você não possui permissão para realizar esta ação.')
  }
}

/** Lista completa (incl. inativos) — exige JWT válido e permissão quando `?all=true`. */
export async function resolveAdminListView(
  request: FastifyRequest,
  permission: PermissionCode,
): Promise<boolean> {
  const query = request.query as Record<string, unknown>
  if (query.all !== 'true') return false
  await requirePermission(request, permission)
  return true
}

/**
 * Visão pública filtrada quando `?public=true` ou sem autenticação válida com permissão.
 * Token inválido não concede visão administrativa.
 */
export async function isPublicContentView(
  request: FastifyRequest,
  permission: PermissionCode,
): Promise<boolean> {
  const query = request.query as Record<string, unknown>
  if (query.public === 'true') return true

  const authed = await tryOptionalAuth(request)
  if (authed && hasPermission(request, permission)) return false

  return true
}
