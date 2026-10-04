import type { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../../lib/http.js'
import type { MediaUpdate } from './media.schema.js'
import * as mediaService from './media.service.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await mediaService.listMedia(request.query as Record<string, unknown>))
}

export async function upload(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) throw new AppError(400, 'Nenhuma imagem enviada.')
  const buffer = await file.toBuffer()
  const folder = (request.query as { folder?: string }).folder ?? 'general'
  const media = await mediaService.uploadMedia({
    buffer,
    filename: file.filename,
    mimetype: file.mimetype,
    folder,
    userId: request.authUser!.id,
  })
  return reply.status(201).send(media)
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await mediaService.deleteMedia(id, request.authUser!.id))
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await mediaService.updateMedia(id, request.body as MediaUpdate))
}
