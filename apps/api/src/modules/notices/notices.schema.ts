import { z } from 'zod'

export const noticeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.enum(['IMPORTANTE', 'COMUNICADO', 'LITURGIA', 'EVENTO', 'URGENTE']),
  priority: z.number().int().default(0),
  imageId: z.string().optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional().nullable(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
})

export const updateNoticeSchema = noticeSchema.partial()

export type NoticeInput = z.infer<typeof noticeSchema>
export type NoticeUpdate = z.infer<typeof updateNoticeSchema>
