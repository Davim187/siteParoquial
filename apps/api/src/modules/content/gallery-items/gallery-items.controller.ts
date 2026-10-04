import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GalleryItemInput } from './gallery-items.schema.js'
import * as galleryItemsService from './gallery-items.service.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await galleryItemsService.listGalleryItems(request.query as Record<string, unknown>))
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send(await galleryItemsService.createGalleryItem(request.body as GalleryItemInput))
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await galleryItemsService.deleteGalleryItem(id))
}
