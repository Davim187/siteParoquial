import { z } from 'zod'

export const updateMassSchema = z.object({
  weekday: z.number().int().min(0).max(6).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  type: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  notes: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

export const massSchema = updateMassSchema
  .extend({
    time: z.string().regex(/^\d{2}:\d{2}$/),
    type: z.string().min(2),
    location: z.string().min(2),
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const hasDate = Boolean(data.date)
    const hasWeekday = data.weekday !== null && data.weekday !== undefined
    if (hasDate === hasWeekday) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe uma data específica ou um dia da semana fixo.',
        path: ['date'],
      })
    }
  })

export type MassInput = z.infer<typeof massSchema>
export type MassUpdate = z.infer<typeof updateMassSchema>
