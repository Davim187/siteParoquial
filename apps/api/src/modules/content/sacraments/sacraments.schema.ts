import { z } from 'zod'

export const updateSacramentSchema = z.object({
  name: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  whatItIs: z.string().optional(),
  whoCanReceive: z.string().optional(),
  howItWorks: z.string().optional(),
  documents: z.array(z.string()).optional(),
  howToRegister: z.string().optional(),
  secretaryContact: z.string().optional(),
  imageId: z.string().nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export type SacramentUpdate = z.infer<typeof updateSacramentSchema>
