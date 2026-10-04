import { z } from 'zod'

export const createGalleryItemSchema = z.object({
  title: z.string().min(2),
  alt: z.string().min(2),
  category: z.enum([
    'MISSAS',
    'EVENTOS',
    'FESTA_PADROEIRA',
    'SEMANA_SANTA',
    'CATEQUESE',
    'JUVENTUDE',
    'PASTORAIS',
    'ACOES_SOCIAIS',
  ]),
  mediaId: z.string(),
  date: z.string().datetime().optional(),
  active: z.boolean().default(true),
})

export type GalleryItemInput = z.infer<typeof createGalleryItemSchema>
