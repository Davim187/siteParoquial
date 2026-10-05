import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import { ZodError } from 'zod'
import { messagesRouter } from '../src/modules/content/messages/messages.router.js'

describe('rotas de mensagens', () => {
  it('registra a exclusão e exige autenticação', async () => {
    const app = Fastify()
    await app.register(jwt, { secret: 'teste-de-mensagens-com-32-chars' })
    await app.register(messagesRouter)

    const missing = await app.inject({ method: 'DELETE', url: '/nao-existe' })
    const remove = await app.inject({ method: 'DELETE', url: '/messages/abc' })
    const list = await app.inject({ method: 'GET', url: '/messages' })
    const update = await app.inject({ method: 'PATCH', url: '/messages/abc', payload: { status: 'READ' } })

    assert.equal(missing.statusCode, 404)
    assert.notEqual(remove.statusCode, 404)
    assert.equal(remove.statusCode, 401)
    assert.equal(list.statusCode, 401)
    assert.equal(update.statusCode, 401)
    await app.close()
  })

  it('recusa contato inválido antes de gravar', async () => {
    const app = Fastify()
    app.setErrorHandler((error, _request, reply) => {
      if (error instanceof ZodError) {
        return reply.status(422).send({ message: 'Dados inválidos.' })
      }
      const statusCode = 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500
      return reply.status(statusCode).send({ message: error.message })
    })
    await app.register(messagesRouter)

    const response = await app.inject({
      method: 'POST',
      url: '/contact',
      payload: { name: 'A', email: 'ruim', subject: 'x', message: 'oi' },
    })

    assert.equal(response.statusCode, 422)
    await app.close()
  })
})
