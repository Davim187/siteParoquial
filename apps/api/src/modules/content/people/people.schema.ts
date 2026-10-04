import { z } from 'zod'

const personType = z.enum(['PADRE', 'DIACONO', 'COORDENADOR', 'PASTORAL_RESPONSAVEL'])

export const createPersonSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  type: personType,
  roleTitle: z.string().min(2),
  bio: z.string().min(3),
  quote: z.string().optional().nullable(),
  ministry: z.string().optional().nullable(),
  attendance: z.string().optional().nullable(),
  photoId: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().default(0),
})

export const updatePersonSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  type: personType.optional(),
  roleTitle: z.string().optional(),
  bio: z.string().optional(),
  quote: z.string().nullable().optional(),
  ministry: z.string().nullable().optional(),
  attendance: z.string().nullable().optional(),
  photoId: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export type PersonInput = z.infer<typeof createPersonSchema>
export type PersonUpdate = z.infer<typeof updatePersonSchema>
