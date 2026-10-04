import { z } from 'zod'

export const updateMediaSchema = z.object({
  folder: z.string().optional(),
  originalName: z.string().optional(),
})

export type MediaUpdate = z.infer<typeof updateMediaSchema>
