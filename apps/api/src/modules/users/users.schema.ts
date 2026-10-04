import { z } from 'zod'

export const roleCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9_]{1,31}$/, 'Use letras maiúsculas, números e underline (ex.: COORDENADOR).')

export const createRoleSchema = z.object({
  code: roleCodeSchema,
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
})

export const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional(),
})

export const createUserSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    role: roleCodeSchema,
    active: z.boolean().optional().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'A confirmação de senha não confere.',
    path: ['confirmPassword'],
  })

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: roleCodeSchema.optional(),
  active: z.boolean().optional(),
  avatarUrl: z.string().nullable().optional(),
})

export const passwordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'A confirmação de senha não confere.',
    path: ['confirmPassword'],
  })

export const permissionsSchema = z.object({
  overrides: z.array(
    z.object({
      code: z.string(),
      granted: z.boolean(),
    }),
  ),
})

export const profileSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  confirmPassword: z.string().optional(),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type PasswordInput = z.infer<typeof passwordSchema>
export type PermissionsInput = z.infer<typeof permissionsSchema>
export type ProfileInput = z.infer<typeof profileSchema>
