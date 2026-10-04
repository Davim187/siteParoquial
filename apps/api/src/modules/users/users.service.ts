import argon2 from 'argon2'
import type { PermissionCode } from '@prisma/client'
import { AppError } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { loadAuthUser } from '../../middlewares/authorize.js'
import type {
  CreateRoleInput,
  CreateUserInput,
  PasswordInput,
  PermissionsInput,
  ProfileInput,
  UpdateRoleInput,
  UpdateUserInput,
} from './users.schema.js'
import * as usersRepository from './users.repository.js'

type Actor = { userId: string; ip?: string }

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

export async function listRoles() {
  const roles = await usersRepository.listRoles()
  return { data: roles.map(serializeRole) }
}

export async function getRole(code: string) {
  const role = await usersRepository.findRoleByCode(code.toUpperCase())
  if (!role) throw new AppError(404, 'Perfil não encontrado.')
  return { data: serializeRole(role) }
}

export async function createRole(data: CreateRoleInput, actor: Actor) {
  const exists = await usersRepository.findRoleRecordByCode(data.code)
  if (exists) throw new AppError(409, 'Já existe um perfil com este código.')

  const role = await usersRepository.createRole({
    code: data.code,
    name: data.name.trim(),
    description: data.description?.trim() || null,
  })

  await usersRepository.syncRolePermissions(role.id, data.permissions)

  const saved = await usersRepository.findRoleById(role.id)

  await logActivity({
    userId: actor.userId,
    action: 'create',
    entity: 'role',
    entityId: role.id,
    ip: actor.ip,
    metadata: { code: role.code, name: role.name },
  })

  return { data: serializeRole(saved) }
}

export async function updateRole(code: string, data: UpdateRoleInput, actor: Actor) {
  const role = await usersRepository.findRoleRecordByCode(code.toUpperCase())
  if (!role) throw new AppError(404, 'Perfil não encontrado.')

  if (role.code === 'ADMIN' && data.permissions) {
    throw new AppError(400, 'O perfil Administrador possui acesso total e não pode ter permissões alteradas.')
  }

  await usersRepository.updateRole(role.id, {
    name: data.name?.trim(),
    description: data.description === undefined ? undefined : data.description?.trim() || null,
  })

  if (data.permissions) {
    await usersRepository.syncRolePermissions(role.id, data.permissions)
  }

  const saved = await usersRepository.findRoleById(role.id)

  await logActivity({
    userId: actor.userId,
    action: 'update',
    entity: 'role',
    entityId: role.id,
    ip: actor.ip,
  })

  return { data: serializeRole(saved) }
}

export async function deleteRole(code: string, actor: Actor) {
  const role = await usersRepository.findRoleForDelete(code.toUpperCase())
  if (!role) throw new AppError(404, 'Perfil não encontrado.')
  if (role.code === 'ADMIN') throw new AppError(400, 'O perfil Administrador não pode ser excluído.')
  if (role._count.users > 0) {
    throw new AppError(400, 'Não é possível excluir um perfil com usuários vinculados.')
  }

  await usersRepository.deleteRole(role.id)

  await logActivity({
    userId: actor.userId,
    action: 'delete',
    entity: 'role',
    entityId: role.id,
    ip: actor.ip,
    metadata: { code: role.code },
  })

  return { ok: true }
}

export async function listPermissions() {
  const permissions = await usersRepository.listPermissionsOrdered()
  return { data: permissions }
}

export async function listUsers() {
  const users = await usersRepository.listUsers()
  return { data: users.map(serializeUser) }
}

export async function getUser(id: string) {
  const user = await usersRepository.findUserById(id)
  if (!user) throw new AppError(404, 'Usuário não encontrado.')
  const auth = await loadAuthUser(user.id)
  return {
    data: {
      ...serializeUser(user),
      rolePermissions: user.role.permissions.map((item) => item.permission.code),
      effectivePermissions: auth.permissions,
    },
  }
}

export async function createUser(data: CreateUserInput, actor: Actor) {
  const role = await usersRepository.findRoleRecordByCode(data.role)
  if (!role) throw new AppError(400, 'Perfil inválido.')
  const exists = await usersRepository.findUserByEmail(data.email.toLowerCase())
  if (exists) throw new AppError(409, 'Já existe um usuário com este e-mail.')

  const passwordHash = await argon2.hash(data.password)
  const user = await usersRepository.createUser({
    name: data.name.trim(),
    email: data.email.toLowerCase(),
    passwordHash,
    active: data.active,
    roleId: role.id,
  })
  await logActivity({
    userId: actor.userId,
    action: 'create',
    entity: 'user',
    entityId: user.id,
    ip: actor.ip,
    metadata: { email: user.email, role: user.role.code },
  })
  return { data: serializeUser(user) }
}

export async function updateUser(id: string, data: UpdateUserInput, actor: Actor) {
  const current = await usersRepository.findUserRecordById(id)
  if (!current) throw new AppError(404, 'Usuário não encontrado.')

  if (data.email && data.email.toLowerCase() !== current.email) {
    const exists = await usersRepository.findUserByEmail(data.email.toLowerCase())
    if (exists) throw new AppError(409, 'Já existe um usuário com este e-mail.')
  }

  let roleId = current.roleId
  if (data.role) {
    const role = await usersRepository.findRoleRecordByCode(data.role)
    if (!role) throw new AppError(400, 'Perfil inválido.')
    roleId = role.id
  }

  const user = await usersRepository.updateUser(id, {
    name: data.name?.trim(),
    email: data.email?.toLowerCase(),
    active: data.active,
    avatarUrl: data.avatarUrl === undefined ? undefined : data.avatarUrl,
    roleId,
  })
  await logActivity({
    userId: actor.userId,
    action: 'update',
    entity: 'user',
    entityId: id,
    ip: actor.ip,
  })
  return { data: serializeUser(user) }
}

export async function resetPassword(id: string, data: PasswordInput, actor: Actor) {
  const user = await usersRepository.findUserForPassword(id)
  if (!user) throw new AppError(404, 'Usuário não encontrado.')
  await usersRepository.updatePasswordHash(id, await argon2.hash(data.password))
  await usersRepository.revokeUserRefreshTokens(id)
  await logActivity({
    userId: actor.userId,
    action: 'reset_password',
    entity: 'user',
    entityId: id,
    ip: actor.ip,
  })
  return { ok: true }
}

export async function updatePermissions(id: string, data: PermissionsInput, actor: Actor) {
  const user = await usersRepository.findUserWithRole(id)
  if (!user) throw new AppError(404, 'Usuário não encontrado.')
  if (user.role.code === 'ADMIN') {
    throw new AppError(400, 'Administradores já possuem acesso total; overrides não se aplicam.')
  }

  await usersRepository.replacePermissionOverrides(id, data.overrides)

  const auth = await loadAuthUser(id)
  await logActivity({
    userId: actor.userId,
    action: 'update_permissions',
    entity: 'user',
    entityId: id,
    ip: actor.ip,
    metadata: { overrides: data.overrides },
  })
  return {
    data: {
      overrides: data.overrides,
      effectivePermissions: auth.permissions,
    },
  }
}

export async function deleteUser(id: string, actor: Actor) {
  if (id === actor.userId) throw new AppError(400, 'Você não pode excluir a própria conta.')
  const user = await usersRepository.findUserForPassword(id)
  if (!user) throw new AppError(404, 'Usuário não encontrado.')
  await usersRepository.deleteUser(id)
  await logActivity({
    userId: actor.userId,
    action: 'delete',
    entity: 'user',
    entityId: id,
    ip: actor.ip,
    metadata: { email: user.email },
  })
  return { ok: true }
}

export async function getProfile(userId: string) {
  const auth = await loadAuthUser(userId)
  const user = await usersRepository.findProfile(userId)
  return {
    data: {
      ...serializeUser(user),
      permissions: auth.permissions,
    },
  }
}

export async function updateProfile(userId: string, data: ProfileInput, ip?: string) {
  const user = await usersRepository.findProfileRecord(userId)

  if (data.newPassword) {
    if (!data.currentPassword) throw new AppError(400, 'Informe a senha atual.')
    if (data.newPassword !== data.confirmPassword) {
      throw new AppError(400, 'A confirmação de senha não confere.')
    }
    const valid = await argon2.verify(user.passwordHash, data.currentPassword)
    if (!valid) throw new AppError(400, 'Senha atual incorreta.')
  }

  const updated = await usersRepository.updateUser(user.id, {
    name: data.name?.trim(),
    avatarUrl: data.avatarUrl === undefined ? undefined : data.avatarUrl,
    passwordHash: data.newPassword ? await argon2.hash(data.newPassword) : undefined,
  })

  await logActivity({
    userId: user.id,
    action: 'update_profile',
    entity: 'user',
    entityId: user.id,
    ip,
  })

  return { data: { ...serializeUser(updated), permissions: (await loadAuthUser(user.id)).permissions } }
}
