import { z } from 'zod'

export const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  type: z.enum(['MISSA', 'CELEBRACAO', 'EVENTO', 'REUNIAO', 'FORMACAO', 'ADORACAO', 'CONFISSAO', 'PASTORAL', 'OUTRO']),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional().nullable(),
  location: z.string().min(2),
  imageId: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  responsible: z.string().optional().nullable(),
  externalUrl: z.string().url().optional().nullable().or(z.literal('')),
})

export const updateEventSchema = eventSchema.partial()

export type EventInput = z.infer<typeof eventSchema>
export type EventUpdate = z.infer<typeof updateEventSchema>
