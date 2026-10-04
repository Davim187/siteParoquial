import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AlbumInput, AlbumPublish, AlbumUpdate, PhotoInput, PhotoReorder, PhotoUpdate } from './gallery.schema.js'
import * as galleryService from './gallery.service.js'

export async function listAlbums(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await galleryService.listAlbums(request.query as Record<string, unknown>))
}

export async function getAlbum(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string }
  const query = request.query as Record<string, unknown>
  return reply.send(await galleryService.getAlbumBySlug(slug, query.all === 'true'))
}

export async function createAlbum(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send(await galleryService.createAlbum(request.body as AlbumInput, request.authUser!.id))
}

export async function updateAlbum(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await galleryService.updateAlbum(id, request.body as AlbumUpdate, request.authUser!.id))
}

export async function publishAlbum(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await galleryService.publishAlbum(id, request.body as AlbumPublish))
}

export async function deleteAlbum(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await galleryService.deleteAlbum(id, request.authUser!.id))
}

export async function addPhoto(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.status(201).send(await galleryService.addPhoto(id, request.body as PhotoInput))
}

export async function bulkUpload(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const result = await galleryService.bulkUploadPhotos(id, request.files(), request.authUser!.id)
  return reply.status(result.statusCode).send(result.body)
}

export async function reorderPhotos(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await galleryService.reorderPhotos(id, request.body as PhotoReorder))
}

export async function updatePhoto(request: FastifyRequest, reply: FastifyReply) {
  const { albumId, photoId } = request.params as { albumId: string; photoId: string }
  return reply.send(await galleryService.updatePhoto(albumId, photoId, request.body as PhotoUpdate))
}

export async function deletePhoto(request: FastifyRequest, reply: FastifyReply) {
  const { albumId, photoId } = request.params as { albumId: string; photoId: string }
  return reply.send(await galleryService.deletePhoto(albumId, photoId))
}
