import { z } from 'zod'

export const newsInputSchema = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  subtitle: z.string().optional().nullable(),
  excerpt: z.string().min(3),
  content: z.string().min(3),
  coverMediaId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
  galleryMediaIds: z.array(z.string()).optional(),
  showProgress: z.boolean().default(false),
  progressLabel: z.string().optional().nullable(),
  progressCurrent: z.coerce.number().min(0).optional(),
  progressGoal: z.coerce.number().min(0).optional(),
})

export const newsStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
})

export const updateNewsSchema = newsInputSchema.partial()

export type NewsInput = z.infer<typeof newsInputSchema>
export type NewsUpdate = z.infer<typeof updateNewsSchema>
export type NewsStatusInput = z.infer<typeof newsStatusSchema>
