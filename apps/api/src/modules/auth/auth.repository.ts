import { prisma } from '../../lib/prisma.js'

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })
}

export function createRefreshToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
  return prisma.refreshToken.create({ data })
}

export function touchLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })
}

export function findActiveRefreshToken(tokenHash: string) {
  return prisma.refreshToken.findFirst({
    where: { tokenHash, revokedAt: null },
  })
}

export function findUserById(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId } })
}

export function revokeRefreshToken(tokenHash: string) {
  return prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  })
}

export function invalidatePasswordResetTokens(userId: string) {
  return prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  })
}

export function createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
  return prisma.passwordResetToken.create({ data })
}

export function findPasswordResetToken(tokenHash: string) {
  return prisma.passwordResetToken.findUnique({ where: { tokenHash } })
}

export function markPasswordResetUsed(id: string) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  })
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
