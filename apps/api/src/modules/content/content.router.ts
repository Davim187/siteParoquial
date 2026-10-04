import type { FastifyInstance } from 'fastify'
import { pastoralsRouter } from './pastorals/pastorals.router.js'
import { sacramentsRouter } from './sacraments/sacraments.router.js'
import { peopleRouter } from './people/people.router.js'
import { galleryItemsRouter } from './gallery-items/gallery-items.router.js'
import { prayersRouter } from './prayers/prayers.router.js'
import { messagesRouter } from './messages/messages.router.js'
import { settingsRouter } from './settings/settings.router.js'
import { dashboardRouter } from './dashboard/dashboard.router.js'

export async function contentRouter(app: FastifyInstance) {
  await app.register(pastoralsRouter)
  await app.register(sacramentsRouter)
  await app.register(peopleRouter)
  await app.register(galleryItemsRouter)
  await app.register(prayersRouter)
  await app.register(messagesRouter)
  await app.register(settingsRouter)
  await app.register(dashboardRouter)
}
