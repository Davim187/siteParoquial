import type { PermissionCode, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

const roleInclude = {
  permissions: { include: { permission: true } },
  _count: { select: { users: true } },
} satisfies Prisma.RoleInclude

const userInclude = {
  role: true,
  permissionOverrides: { include: { permission: true } },
} satisfies Prisma.UserInclude

export function listRoles() {
  return prisma.role.findMany({
    include: roleInclude,
    orderBy: { name: 'asc' },
  })
}

export function findRoleByCode(code: string) {
  return prisma.role.findUnique({
    where: { code },
    include: roleInclude,
  })
}

export function findRoleRecordByCode(code: string) {
  return prisma.role.findUnique({ where: { code } })
}

export function createRole(data: { code: string; name: string; description: string | null }) {
  return prisma.role.create({ data })
}

export function updateRole(id: string, data: Prisma.RoleUpdateInput) {
  return prisma.role.update({ where: { id }, data })
}

export function findRoleById(id: string) {
  return prisma.role.findUniqueOrThrow({
    where: { id },
    include: roleInclude,
  })
}

export function findRoleForDelete(code: string) {
  return prisma.role.findUnique({
    where: { code },
    include: { _count: { select: { users: true } } },
  })
}

export function deleteRole(id: string) {
  return prisma.role.delete({ where: { id } })
}

export function listPermissions() {
  return prisma.permission.findMany()
}

export function listPermissionsOrdered() {
  return prisma.permission.findMany({ orderBy: { code: 'asc' } })
}

export async function syncRolePermissions(roleId: string, codes: string[]) {
  const permissions = await listPermissions()
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

export function listUsers() {
  return prisma.user.findMany({
    include: userInclude,
    orderBy: { name: 'asc' },
  })
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      permissionOverrides: { include: { permission: true } },
    },
  })
}

export function findUserRecordById(id: string) {
  return prisma.user.findUnique({ where: { id }, include: { role: true } })
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export function createUser(data: Prisma.UserUncheckedCreateInput) {
  return prisma.user.create({
    data,
    include: userInclude,
  })
}

export function updateUser(id: string, data: Prisma.UserUncheckedUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
    include: userInclude,
  })
}

export function findUserForPassword(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export function updatePasswordHash(id: string, passwordHash: string) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
  })
}

export function revokeUserRefreshTokens(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export function findUserWithRole(id: string) {
  return prisma.user.findUnique({ where: { id }, include: { role: true } })
}

export async function replacePermissionOverrides(
  userId: string,
  overrides: Array<{ code: string; granted: boolean }>,
) {
  const permissions = await listPermissions()
  const byCode = new Map(permissions.map((item) => [item.code, item.id]))

  await prisma.$transaction([
    prisma.userPermission.deleteMany({ where: { userId } }),
    prisma.userPermission.createMany({
      data: overrides
        .filter((item) => byCode.has(item.code as PermissionCode))
        .map((item) => ({
          userId,
          permissionId: byCode.get(item.code as PermissionCode)!,
          granted: item.granted,
        })),
    }),
  ])
}

export function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}

export function findProfile(id: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id },
    include: userInclude,
  })
}

export function findProfileRecord(id: string) {
  return prisma.user.findUniqueOrThrow({ where: { id } })
}
