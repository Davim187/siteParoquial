import type { FastifyReply, FastifyRequest } from 'fastify'
import type {
  CreateRoleInput,
  CreateUserInput,
  PasswordInput,
  PermissionsInput,
  ProfileInput,
  UpdateRoleInput,
  UpdateUserInput,
} from './users.schema.js'
import * as usersService from './users.service.js'

function clientIp(request: FastifyRequest) {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0]?.trim()
  return request.ip
}

function actor(request: FastifyRequest) {
  return { userId: request.authUser!.id, ip: clientIp(request) }
}

export async function listRoles(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await usersService.listRoles())
}

export async function getRole(request: FastifyRequest, reply: FastifyReply) {
  const { code } = request.params as { code: string }
  return reply.send(await usersService.getRole(code))
}

export async function createRole(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await usersService.createRole(request.body as CreateRoleInput, actor(request)))
}

export async function updateRole(request: FastifyRequest, reply: FastifyReply) {
  const { code } = request.params as { code: string }
  return reply.send(await usersService.updateRole(code, request.body as UpdateRoleInput, actor(request)))
}

export async function deleteRole(request: FastifyRequest, reply: FastifyReply) {
  const { code } = request.params as { code: string }
  return reply.send(await usersService.deleteRole(code, actor(request)))
}

export async function listPermissions(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await usersService.listPermissions())
}

export async function listUsers(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await usersService.listUsers())
}

export async function getUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await usersService.getUser(id))
}

export async function createUser(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await usersService.createUser(request.body as CreateUserInput, actor(request)))
}

export async function updateUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await usersService.updateUser(id, request.body as UpdateUserInput, actor(request)))
}

export async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await usersService.resetPassword(id, request.body as PasswordInput, actor(request)))
}

export async function updatePermissions(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await usersService.updatePermissions(id, request.body as PermissionsInput, actor(request)))
}

export async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await usersService.deleteUser(id, actor(request)))
}

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await usersService.getProfile(request.authUser!.id))
}

export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await usersService.updateProfile(request.authUser!.id, request.body as ProfileInput, clientIp(request)))
}
