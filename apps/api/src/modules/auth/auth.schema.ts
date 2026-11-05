                                                                                      import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
})

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'A confirmação de senha não confere.',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
export type LogoutInput = z.infer<typeof logoutSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
