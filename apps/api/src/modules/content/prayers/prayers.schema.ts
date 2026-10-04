import { z } from 'zod'

export const createPrayerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().nullable(),
  request: z.string().min(5),
  anonymous: z.boolean().default(false),
})

export const updatePrayerSchema = z.object({
  status: z.enum(['NEW', 'PRAYED', 'ARCHIVED']),
})

export type PrayerInput = z.infer<typeof createPrayerSchema>
export type PrayerUpdate = z.infer<typeof updatePrayerSchema>
