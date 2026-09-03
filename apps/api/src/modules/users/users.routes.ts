import type { FastifyInstance } from 'fastify'
import argon2 from 'argon2'
import { z } from 'zod'
import type { PermissionCode } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError, paginated, parsePagination } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { authorize, loadAuthUser } from '../../middlewares/authorize.js'

const roleCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9_]{1,31}$/, 'Use letras maiúsculas, números e underline (ex.: COORDENADOR).')

const createRoleSchema = z.object({
  code: roleCodeSchema,
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
})

const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional(),
})

const createUserSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    role: roleCodeSchema,
    active: z.boolean().optional().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'A confirmação de senha não confere.',
    path: ['confirmPassword'],
  })

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: roleCodeSchema.optional(),
  active: z.boolean().optional(),
  avatarUrl: z.string().nullable().optional(),
})

const passwordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'A confirmação de senha não confere.',
    path: ['confirmPassword'],
  })

const permissionsSchema = z.object({
  overrides: z.array(
    z.object({
      code: z.string(),
      granted: z.boolean(),
    }),
  ),
})

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  confirmPassword: z.string().optional(),
})

function clientIp(request: { ip: string; headers: Record<string, unknown> }) {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0]?.trim()
  return request.ip
}

function serializeUser(user: {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  active: boolean
  lastLoginAt: Date | null
  createdAt: Date
  role: { code: string; name: string }
  permissionOverrides?: Array<{ granted: boolean; permission: { code: PermissionCode } }>
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    active: user.active,
    role: user.role.code,
    roleName: user.role.name,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    overrides: (user.permissionOverrides ?? []).map((item) => ({
      code: item.permission.code,
      granted: item.granted,
    })),
  }
}

function serializeRole(role: {
  id: string
  code: string
  name: string
  description: string | null
  permissions: Array<{ permission: { code: PermissionCode; name: string } }>
  _count?: { users: number }
}) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map((item) => item.permission.code),
    permissionDetails: role.permissions.map((item) => ({
      code: item.permission.code,
      name: item.permission.name,
    })),
    userCount: role._count?.users ?? 0,
    isSystem: role.code === 'ADMIN',
  }
}

async function syncRolePermissions(roleId: string, codes: string[]) {
  const permissions = await prisma.permission.findMany()
  const byCode = new Map(permissions.map((item) => [item.code, item.id]))
  const validCodes = codes.filter((code) => byCode.has(code as PermissionCode))

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: validCodes.map((code) => ({
        roleId,
        permissionId: byCode.get(code as PermissionCode)!,
      })),
    }),
  ])
}

export async function usersRoutes(app: FastifyInstance) {
  app.get('/roles', { preHandler: [authorize('USERS_MANAGE')] }, async (_request, reply) => {
    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    })
    return reply.send({ data: roles.map(serializeRole) })
  })

  app.get('/roles/:code', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const { code } = request.params as { code: string }
    const role = await prisma.role.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    })
    if (!role) throw new AppError(404, 'Perfil não encontrado.')
    return reply.send({ data: serializeRole(role) })
  })

  app.post('/roles', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const data = createRoleSchema.parse(request.body)
    const exists = await prisma.role.findUnique({ where: { code: data.code } })
    if (exists) throw new AppError(409, 'Já existe um perfil com este código.')

    const role = await prisma.role.create({
      data: {
        code: data.code,
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    })

    await syncRolePermissions(role.id, data.permissions)

    const saved = await prisma.role.findUniqueOrThrow({
      where: { id: role.id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    })

    await logActivity({
      userId: request.authUser!.id,
      action: 'create',
      entity: 'role',
      entityId: role.id,
      ip: clientIp(request),
      metadata: { code: role.code, name: role.name },
    })

    return reply.code(201).send({ data: serializeRole(saved) })
  })

  app.put('/roles/:code', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const { code } = request.params as { code: string }
    const data = updateRoleSchema.parse(request.body)
    const role = await prisma.role.findUnique({ where: { code: code.toUpperCase() } })
    if (!role) throw new AppError(404, 'Perfil não encontrado.')

    if (role.code === 'ADMIN' && data.permissions) {
      throw new AppError(400, 'O perfil Administrador possui acesso total e não pode ter permissões alteradas.')
    }

    await prisma.role.update({
      where: { id: role.id },
      data: {
        name: data.name?.trim(),
        description: data.description === undefined ? undefined : data.description?.trim() || null,
      },
    })

    if (data.permissions) {
      await syncRolePermissions(role.id, data.permissions)
    }

    const saved = await prisma.role.findUniqueOrThrow({
      where: { id: role.id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    })

    await logActivity({
      userId: request.authUser!.id,
      action: 'update',
      entity: 'role',
      entityId: role.id,
      ip: clientIp(request),
    })

    return reply.send({ data: serializeRole(saved) })
  })

  app.delete('/roles/:code', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const { code } = request.params as { code: string }
    const role = await prisma.role.findUnique({
      where: { code: code.toUpperCase() },
      include: { _count: { select: { users: true } } },
    })
    if (!role) throw new AppError(404, 'Perfil não encontrado.')
    if (role.code === 'ADMIN') throw new AppError(400, 'O perfil Administrador não pode ser excluído.')
    if (role._count.users > 0) {
      throw new AppError(400, 'Não é possível excluir um perfil com usuários vinculados.')
    }

    await prisma.role.delete({ where: { id: role.id } })

    await logActivity({
      userId: request.authUser!.id,
      action: 'delete',
      entity: 'role',
      entityId: role.id,
      ip: clientIp(request),
      metadata: { code: role.code },
    })

    return reply.send({ ok: true })
  })

  app.get('/permissions', { preHandler: [authorize('USERS_MANAGE')] }, async (_request, reply) => {
    const permissions = await prisma.permission.findMany({ orderBy: { code: 'asc' } })
    return reply.send({ data: permissions })
  })

  app.get('/users', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as Record<string, unknown>)
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        include: {
          role: true,
          permissionOverrides: { include: { permission: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
    ])
    return reply.send(paginated(users.map(serializeUser), total, page, limit))
  })

  app.get('/users/:id', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        permissionOverrides: { include: { permission: true } },
      },
    })
    if (!user) throw new AppError(404, 'Usuário não encontrado.')
    const auth = await loadAuthUser(user.id)
    return reply.send({
      data: {
        ...serializeUser(user),
        rolePermissions: user.role.permissions.map((item) => item.permission.code),
        effectivePermissions: auth.permissions,
      },
    })
  })

  app.post('/users', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const data = createUserSchema.parse(request.body)
    const role = await prisma.role.findUnique({ where: { code: data.role } })
    if (!role) throw new AppError(400, 'Perfil inválido.')
    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
    if (exists) throw new AppError(409, 'Já existe um usuário com este e-mail.')

    const passwordHash = await argon2.hash(data.password)
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase(),
        passwordHash,
        active: data.active,
        roleId: role.id,
      },
      include: { role: true, permissionOverrides: { include: { permission: true } } },
    })
    await logActivity({
      userId: request.authUser!.id,
      action: 'create',
      entity: 'user',
      entityId: user.id,
      ip: clientIp(request),
      metadata: { email: user.email, role: user.role.code },
    })
    return reply.code(201).send({ data: serializeUser(user) })
  })

  app.put('/users/:id', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = updateUserSchema.parse(request.body)
    const current = await prisma.user.findUnique({ where: { id }, include: { role: true } })
    if (!current) throw new AppError(404, 'Usuário não encontrado.')

    if (data.email && data.email.toLowerCase() !== current.email) {
      const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
      if (exists) throw new AppError(409, 'Já existe um usuário com este e-mail.')
    }

    let roleId = current.roleId
    if (data.role) {
      const role = await prisma.role.findUnique({ where: { code: data.role } })
      if (!role) throw new AppError(400, 'Perfil inválido.')
      roleId = role.id
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        email: data.email?.toLowerCase(),
        active: data.active,
        avatarUrl: data.avatarUrl === undefined ? undefined : data.avatarUrl,
        roleId,
      },
      include: { role: true, permissionOverrides: { include: { permission: true } } },
    })
    await logActivity({
      userId: request.authUser!.id,
      action: 'update',
      entity: 'user',
      entityId: id,
      ip: clientIp(request),
    })
    return reply.send({ data: serializeUser(user) })
  })

  app.patch('/users/:id/password', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = passwordSchema.parse(request.body)
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new AppError(404, 'Usuário não encontrado.')
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await argon2.hash(data.password) },
    })
    await prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    await logActivity({
      userId: request.authUser!.id,
      action: 'reset_password',
      entity: 'user',
      entityId: id,
      ip: clientIp(request),
    })
    return reply.send({ ok: true })
  })

  app.put('/users/:id/permissions', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = permissionsSchema.parse(request.body)
    const user = await prisma.user.findUnique({ where: { id }, include: { role: true } })
    if (!user) throw new AppError(404, 'Usuário não encontrado.')
    if (user.role.code === 'ADMIN') {
      throw new AppError(400, 'Administradores já possuem acesso total; overrides não se aplicam.')
    }

    const permissions = await prisma.permission.findMany()
    const byCode = new Map(permissions.map((item) => [item.code, item.id]))

    await prisma.$transaction([
      prisma.userPermission.deleteMany({ where: { userId: id } }),
      prisma.userPermission.createMany({
        data: data.overrides
          .filter((item) => byCode.has(item.code as PermissionCode))
          .map((item) => ({
            userId: id,
            permissionId: byCode.get(item.code as PermissionCode)!,
            granted: item.granted,
          })),
      }),
    ])

    const auth = await loadAuthUser(id)
    await logActivity({
      userId: request.authUser!.id,
      action: 'update_permissions',
      entity: 'user',
      entityId: id,
      ip: clientIp(request),
      metadata: { overrides: data.overrides },
    })
    return reply.send({
      data: {
        overrides: data.overrides,
        effectivePermissions: auth.permissions,
      },
    })
  })

  app.delete('/users/:id', { preHandler: [authorize('USERS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    if (id === request.authUser!.id) throw new AppError(400, 'Você não pode excluir a própria conta.')
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new AppError(404, 'Usuário não encontrado.')
    await prisma.user.delete({ where: { id } })
    await logActivity({
      userId: request.authUser!.id,
      action: 'delete',
      entity: 'user',
      entityId: id,
      ip: clientIp(request),
      metadata: { email: user.email },
    })
    return reply.send({ ok: true })
  })

  app.get('/me/profile', { preHandler: [authorize('DASHBOARD_VIEW')] }, async (request, reply) => {
    const auth = await loadAuthUser(request.authUser!.id)
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.authUser!.id },
      include: { role: true, permissionOverrides: { include: { permission: true } } },
    })
    return reply.send({
      data: {
        ...serializeUser(user),
        permissions: auth.permissions,
      },
    })
  })

  app.patch('/me/profile', { preHandler: [authorize('DASHBOARD_VIEW')] }, async (request, reply) => {
    const data = profileSchema.parse(request.body)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.authUser!.id } })

    if (data.newPassword) {
      if (!data.currentPassword) throw new AppError(400, 'Informe a senha atual.')
      if (data.newPassword !== data.confirmPassword) {
        throw new AppError(400, 'A confirmação de senha não confere.')
      }
      const valid = await argon2.verify(user.passwordHash, data.currentPassword)
      if (!valid) throw new AppError(400, 'Senha atual incorreta.')
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name?.trim(),
        avatarUrl: data.avatarUrl === undefined ? undefined : data.avatarUrl,
        passwordHash: data.newPassword ? await argon2.hash(data.newPassword) : undefined,
      },
      include: { role: true, permissionOverrides: { include: { permission: true } } },
    })

    await logActivity({
      userId: user.id,
      action: 'update_profile',
      entity: 'user',
      entityId: user.id,
      ip: clientIp(request),
    })

    return reply.send({ data: { ...serializeUser(updated), permissions: (await loadAuthUser(user.id)).permissions } })
  })
}
