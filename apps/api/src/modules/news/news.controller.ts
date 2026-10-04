                  import type { FastifyReply, FastifyRequest } from 'fastify'
import { authenticate } from '../../middlewares/authorize.js'
import type { NewsInput, NewsStatusInput, NewsUpdate } from './news.schema.js'
import * as newsService from './news.service.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const hasAuth = Boolean(request.headers.authorization)
  if (hasAuth) {
    try {
      await authenticate()(request)
    } catch {
      // público
    }
  }
  const publicOnly = !request.authUser
  const result = await newsService.listNews(request.query as Record<string, unknown>, { publicOnly })
  return reply.send(result)
}

export async function listCategories(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await newsService.listCategories() })
}

export async function campaign(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: await newsService.getCampaignNews() })
}

export async function getBySlug(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string }
  const result = await newsService.getNewsBySlug(slug, true)
  return reply.send(result)
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await newsService.getNewsById(id))
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const result = await newsService.createNews(request.body as NewsInput, request.authUser!.id)
  return reply.status(201).send(result)
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await newsService.updateNews(id, request.body as NewsUpdate, request.authUser!.id))
}

export async function updateStatus(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await newsService.updateNewsStatus(id, request.body as NewsStatusInput, request.authUser!.id))
}

export async function duplicate(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.status(201).send(await newsService.duplicateNews(id, request.authUser!.id))
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await newsService.deleteNews(id, request.authUser!.id))
}
