import type { FastifyReply, FastifyRequest, preValidationHookHandler } from 'fastify'
import type { ZodTypeAny } from 'zod'

type RequestSchemas = {
  body?: ZodTypeAny
  params?: ZodTypeAny
  querystring?: ZodTypeAny
}

export function validate(schemas: RequestSchemas): preValidationHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (schemas.params) {
      request.params = schemas.params.parse(request.params)
    }
    if (schemas.querystring) {
      request.query = schemas.querystring.parse(request.query)
    }
    if (schemas.body) {
      request.body = schemas.body.parse(request.body)
    }
  }
}
