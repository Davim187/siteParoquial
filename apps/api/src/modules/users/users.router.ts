import type { FastifyInstance } from 'fastify'
import { authorize } from '../../middlewares/authorize.js'
import { validate } from '../../middlewares/validate.js'
import * as usersController from './users.controller.js'
import {
  createRoleSchema,
  createUserSchema,
  passwordSchema,
  permissionsSchema,
  profileSchema,
  updateRoleSchema,
  updateUserSchema,
} from './users.schema.js'

export async function usersRouter(app: FastifyInstance) {
  app.get('/roles', { preHandler: [authorize('USERS_MANAGE')] }, usersController.listRoles)
  app.get('/roles/:code', { preHandler: [authorize('USERS_MANAGE')] }, usersController.getRole)
  app.post('/roles', {
    preValidation: [validate({ body: createRoleSchema })],
    preHandler: [authorize('USERS_MANAGE')],
  }, usersController.createRole)
  app.put('/roles/:code', {
    preValidation: [validate({ body: updateRoleSchema })],
    preHandler: [authorize('USERS_MANAGE')],
  }, usersController.updateRole)
  app.delete('/roles/:code', { preHandler: [authorize('USERS_MANAGE')] }, usersController.deleteRole)
  app.get('/permissions', { preHandler: [authorize('USERS_MANAGE')] }, usersController.listPermissions)
  app.get('/users', { preHandler: [authorize('USERS_MANAGE')] }, usersController.listUsers)
  app.get('/users/:id', { preHandler: [authorize('USERS_MANAGE')] }, usersController.getUser)
  app.post('/users', {
    preValidation: [validate({ body: createUserSchema })],
    preHandler: [authorize('USERS_MANAGE')],
  }, usersController.createUser)
  app.put('/users/:id', {
    preValidation: [validate({ body: updateUserSchema })],
    preHandler: [authorize('USERS_MANAGE')],
  }, usersController.updateUser)
  app.patch('/users/:id/password', {
    preValidation: [validate({ body: passwordSchema })],
    preHandler: [authorize('USERS_MANAGE')],
  }, usersController.resetPassword)
  app.put('/users/:id/permissions', {
    preValidation: [validate({ body: permissionsSchema })],
    preHandler: [authorize('USERS_MANAGE')],
  }, usersController.updatePermissions)
  app.delete('/users/:id', { preHandler: [authorize('USERS_MANAGE')] }, usersController.deleteUser)
  app.get('/me/profile', { preHandler: [authorize('DASHBOARD_VIEW')] }, usersController.getProfile)
  app.patch('/me/profile', {
    preValidation: [validate({ body: profileSchema })],
    preHandler: [authorize('DASHBOARD_VIEW')],
  }, usersController.updateProfile)
}
