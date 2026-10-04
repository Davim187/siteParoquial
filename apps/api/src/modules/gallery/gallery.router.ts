import type { FastifyInstance } from 'fastify'
import { authorize } from '../../middlewares/authorize.js'
import { validate } from '../../middlewares/validate.js'
import * as galleryController from './gallery.controller.js'
import {
  createAlbumSchema,
  createPhotoSchema,
  publishAlbumSchema,
  reorderPhotosSchema,
  updateAlbumSchema,
  updatePhotoSchema,
} from './gallery.schema.js'

export async function galleryRouter(app: FastifyInstance) {
  app.get('/gallery/albums', galleryController.listAlbums)
  app.get('/gallery/albums/:slug', galleryController.getAlbum)
  app.post('/gallery/albums', {
    preValidation: [validate({ body: createAlbumSchema })],
    preHandler: [authorize('GALLERY_MANAGE')],
  }, galleryController.createAlbum)
  app.put('/gallery/albums/:id', {
    preValidation: [validate({ body: updateAlbumSchema })],
    preHandler: [authorize('GALLERY_MANAGE')],
  }, galleryController.updateAlbum)
  app.patch('/gallery/albums/:id/publish', {
    preValidation: [validate({ body: publishAlbumSchema })],
    preHandler: [authorize('GALLERY_MANAGE')],
  }, galleryController.publishAlbum)
  app.delete('/gallery/albums/:id', { preHandler: [authorize('GALLERY_MANAGE')] }, galleryController.deleteAlbum)
  app.post('/gallery/albums/:id/photos', {
    preValidation: [validate({ body: createPhotoSchema })],
    preHandler: [authorize('GALLERY_MANAGE')],
  }, galleryController.addPhoto)
  app.post('/gallery/albums/:id/photos/bulk', { preHandler: [authorize('GALLERY_MANAGE')] }, galleryController.bulkUpload)
  app.put('/gallery/albums/:id/photos/reorder', {
    preValidation: [validate({ body: reorderPhotosSchema })],
    preHandler: [authorize('GALLERY_MANAGE')],
  }, galleryController.reorderPhotos)
  app.patch('/gallery/albums/:albumId/photos/:photoId', {
    preValidation: [validate({ body: updatePhotoSchema })],
    preHandler: [authorize('GALLERY_MANAGE')],
  }, galleryController.updatePhoto)
  app.delete('/gallery/albums/:albumId/photos/:photoId', { preHandler: [authorize('GALLERY_MANAGE')] }, galleryController.deletePhoto)
}
