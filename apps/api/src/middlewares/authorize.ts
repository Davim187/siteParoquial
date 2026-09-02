import type { FastifyReply, FastifyRequest } from 'fastify'
import type { PermissionCode } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/http.js'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: string
  avatarUrl?: string | null
  permissions: PermissionCode[]
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string }
    user: { sub: string; email: string }
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser
  }
}

export async function loadAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
      permissionOverrides: { include: { permission: true } },
    },
  })
  if (!user || !user.active) throw new AppError(401, 'Sessão inválida ou usuário inativo.')

  const permissions = new Set<PermissionCode>(
    user.role.permissions.map((item) => item.permission.code),
  )

  for (const override of user.permissionOverrides) {
    if (override.granted) permissions.add(override.permission.code)
    else permissions.delete(override.permission.code)
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.code,
    avatarUrl: user.avatarUrl,
    permissions: [...permissions],
  }
}

export function authenticate() {
  return async (request: FastifyRequest) => {
    await request.jwtVerify()
    request.authUser = await loadAuthUser(request.user.sub)
  }
}

export function authorize(...required: PermissionCode[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    await request.jwtVerify()
    request.authUser = await loadAuthUser(request.user.sub)
    if (request.authUser.role === 'ADMIN') return
    const ok = required.every((perm) => request.authUser?.permissions.includes(perm))
    if (!ok) throw new AppError(403, 'Você não tem permissão para esta ação.')
  }
}

export function authorizeAny(...required: PermissionCode[]) {
  return async (request: FastifyRequest) => {
    await request.jwtVerify()
    request.authUser = await loadAuthUser(request.user.sub)
    if (request.authUser.role === 'ADMIN') return
    const ok = required.some((perm) => request.authUser?.permissions.includes(perm))
    if (!ok) throw new AppError(403, 'Você não tem permissão para esta ação.')
  }
}
