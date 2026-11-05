import { z } from 'zod'

function parsePastoralKind(value: string) {
  const raw = value.trim().toLowerCase()
  if (raw.startsWith('mov')) return 'MOVIMENTO' as const
  if (raw.startsWith('com')) return 'COMISSAO' as const
  return 'PASTORAL' as const
}

const pastoralKindSchema = z
  .string()
  .optional()
  .transform((value) => parsePastoralKind(value ?? 'pastoral'))

const pastoralKindUpdateSchema = z
  .string()
  .optional()
  .transform((value) => (value ? parsePastoralKind(value) : undefined))

export const createPastoralSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  kind: pastoralKindSchema,
  description: z.string().min(3),
  imageId: z.string().optional().nullable(),
  responsible: z.string().min(2),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  meetingTime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  active: z.boolean().default(true),
})

export const updatePastoralSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  kind: pastoralKindUpdateSchema,
  description: z.string().optional(),
  imageId: z.string().nullable().optional(),
  responsible: z.string().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  meetingTime: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  active: z.boolean().optional(),
})

export type PastoralInput = z.infer<typeof createPastoralSchema>
export type PastoralUpdate = z.infer<typeof updatePastoralSchema>
