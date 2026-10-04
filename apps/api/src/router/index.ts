import type { FastifyInstance } from 'fastify'
import { authRouter } from '../modules/auth/auth.router.js'
import { newsRouter } from '../modules/news/news.router.js'
import { mediaRouter } from '../modules/media/media.router.js'
import { noticesRouter } from '../modules/notices/notices.router.js'
import { eventsRouter } from '../modules/events/events.router.js'
import { massesRouter } from '../modules/masses/masses.router.js'
import { contentRouter } from '../modules/content/content.router.js'
import { galleryRouter } from '../modules/gallery/gallery.router.js'
import { usersRouter } from '../modules/users/users.router.js'

export async function apiRouter(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true, service: 'paroquia-api' }))

  await app.register(authRouter)
  await app.register(newsRouter)
  await app.register(mediaRouter)
  await app.register(noticesRouter)
  await app.register(eventsRouter)
  await app.register(massesRouter)
  await app.register(contentRouter)
  await app.register(galleryRouter)
  await app.register(usersRouter)
}
