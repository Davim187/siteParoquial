import { createHash, randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../lib/http.js'
import { loadAuthUser } from '../../middlewares/authorize.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function login(app: FastifyInstance, body: unknown) {
  const data = loginSchema.parse(body)
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    include: { role: true },
  })
  if (!user || !user.active) throw new AppError(401, 'E-mail ou senha inválidos.')
  const valid = await argon2.verify(user.passwordHash, data.password)
  if (!valid) throw new AppError(401, 'E-mail ou senha inválidos.')

  const accessToken = await app.jwt.sign(
    { sub: user.id, email: user.email },
    { expiresIn: env.JWT_EXPIRES_IN },
  )
  const refreshToken = randomBytes(48).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_EXPIRES_DAYS)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  })
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const authUser = await loadAuthUser(user.id)
  return { accessToken, refreshToken, user: authUser }
}

export async function refresh(app: FastifyInstance, body: unknown) {
  const data = z.object({ refreshToken: z.string().min(20) }).parse(body)
  const tokenHash = hashToken(data.refreshToken)
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, revokedAt: null },
  })
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token inválido ou expirado.')
  }
  const accessToken = await app.jwt.sign(
    { sub: stored.userId, email: (await prisma.user.findUniqueOrThrow({ where: { id: stored.userId } })).email },
    { expiresIn: env.JWT_EXPIRES_IN },
  )
  return { accessToken, user: await loadAuthUser(stored.userId) }
}

export async function logout(body: unknown) {
  const data = z.object({ refreshToken: z.string().optional() }).parse(body)
  if (data.refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(data.refreshToken) },
      data: { revokedAt: new Date() },
    })
  }
  return { ok: true }
}
