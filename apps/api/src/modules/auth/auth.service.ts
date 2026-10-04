import { createHash, randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import type { FastifyInstance } from 'fastify'
import { env } from '../../config/env.js'
import { AppError } from '../../lib/http.js'
import { loadAuthUser } from '../../middlewares/authorize.js'
import type { LoginInput, LogoutInput, RefreshInput } from './auth.schema.js'
import * as authRepository from './auth.repository.js'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function login(app: FastifyInstance, data: LoginInput) {
  const user = await authRepository.findUserByEmail(data.email.toLowerCase())
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

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  })
  await authRepository.touchLastLogin(user.id)

  const authUser = await loadAuthUser(user.id)
  return { accessToken, refreshToken, user: authUser }
}

export async function refresh(app: FastifyInstance, data: RefreshInput) {
  const tokenHash = hashToken(data.refreshToken)
  const stored = await authRepository.findActiveRefreshToken(tokenHash)
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token inválido ou expirado.')
  }
  const user = await authRepository.findUserById(stored.userId)
  const accessToken = await app.jwt.sign(
    { sub: stored.userId, email: user.email },
    { expiresIn: env.JWT_EXPIRES_IN },
  )
  return { accessToken, user: await loadAuthUser(stored.userId) }
}

export async function logout(data: LogoutInput) {
  if (data.refreshToken) {
    await authRepository.revokeRefreshToken(hashToken(data.refreshToken))
  }
  return { ok: true }
}
