import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { env } from './config/env.js'
import { AppError } from './lib/http.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { newsRoutes } from './modules/news/news.routes.js'
import { mediaRoutes } from './modules/media/media.routes.js'
import { noticesRoutes } from './modules/notices/notices.routes.js'
import { eventsRoutes } from './modules/events/events.routes.js'
import { massesRoutes } from './modules/masses/masses.routes.js'
import { contentRoutes } from './modules/content/content.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'

async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: ['req.headers.authorization', 'body.password', 'body.refreshToken'],
    },
  })

  await mkdir(path.resolve(process.cwd(), env.UPLOAD_DIR), { recursive: true })

  await app.register(cors, {
    origin:
      env.NODE_ENV === 'production'
        ? env.CORS_ORIGIN.split(',').map((item) => item.trim())
        : true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
  await app.register(helmet, { crossOriginResourcePolicy: { policy: 'cross-origin' } })
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' })
  await app.register(jwt, { secret: env.JWT_SECRET })
  await app.register(multipart, {
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  })
  await app.register(fastifyStatic, {
    root: path.resolve(process.cwd(), env.UPLOAD_DIR),
    prefix: '/uploads/',
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'API Paróquia Nossa Senhora das Graças',
        description: 'API oficial do site e do painel administrativo',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })
  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
  })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.code ?? 'APP_ERROR', message: error.message })
    }
    const err = error as { validation?: unknown; statusCode?: number; message?: string; code?: string }
    if (err.validation) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', message: err.message ?? 'Dados inválidos.' })
    }
    if (err.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || err.statusCode === 401) {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Autenticação necessária.' })
    }
    request.log.error({ err: error }, 'Unhandled error')
    return reply.status(err.statusCode ?? 500).send({
      error: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Erro interno do servidor.' : err.message ?? 'Erro interno',
    })
  })

  app.get('/api/health', async () => ({ ok: true, service: 'paroquia-api' }))

  await app.register(
    async (api) => {
      await api.register(authRoutes)
      await api.register(newsRoutes)
      await api.register(mediaRoutes)
      await api.register(noticesRoutes)
      await api.register(eventsRoutes)
      await api.register(massesRoutes)
      await api.register(contentRoutes)
      await api.register(usersRoutes)
    },
    { prefix: '/api' },
  )

  return app
}

const app = await buildServer()
await app.listen({ port: env.PORT, host: env.HOST })
app.log.info(`API em http://${env.HOST}:${env.PORT} | docs em /api/docs`)
