import type { FastifyInstance } from 'fastify'
import { authorize } from '../../../middlewares/authorize.js'
import { validate } from '../../../middlewares/validate.js'
import * as galleryItemsController from './gallery-items.controller.js'
import { createGalleryItemSchema } from './gallery-items.schema.js'

export async function galleryItemsRouter(app: FastifyInstance) {
  app.get('/gallery', galleryItemsController.list)
  app.post('/gallery', {
    preValidation: [validate({ body: createGalleryItemSchema })],
    preHandler: [authorize('GALLERY_MANAGE')],
  }, galleryItemsController.create)
  app.delete('/gallery/:id', { preHandler: [authorize('GALLERY_MANAGE')] }, galleryItemsController.remove)
}
