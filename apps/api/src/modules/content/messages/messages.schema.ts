import { z } from 'zod'

export const createMessageSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  subject: z.string().min(2),
  message: z.string().min(5),
})

export const updateMessageSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED']),
})

export type MessageInput = z.infer<typeof createMessageSchema>
export type MessageUpdate = z.infer<typeof updateMessageSchema>
