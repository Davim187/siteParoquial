import { z } from 'zod'

export const albumTitleSchema = z
  .string({ required_error: 'O título do álbum é obrigatório.' })
  .trim()
  .min(2, 'O título deve ter pelo menos 2 caracteres.')
  .max(150, 'O título deve ter no máximo 150 caracteres.')

export const albumDescriptionSchema = z
  .string()
  .trim()
  .max(2000, 'A descrição deve ter no máximo 2000 caracteres.')
  .optional()
  .nullable()

export const createAlbumSchema = z.object({
  title: albumTitleSchema,
  slug: z.string().trim().max(180).optional(),
  description: albumDescriptionSchema,
  coverMediaId: z.string().cuid().optional().nullable(),
  eventDate: z.union([
    z.string().datetime({ message: 'Informe uma data válida.' }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
  ]),
  active: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(9999).default(0),
})

export const updateAlbumSchema = createAlbumSchema.partial()

export const createPhotoSchema = z.object({
  mediaId: z.string().cuid('Selecione uma imagem válida.'),
  title: z.string().trim().max(150).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
})

export const updatePhotoSchema = z.object({
  title: z.string().trim().max(150).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
})

export const reorderPhotosSchema = z.object({
  photoIds: z.array(z.string().cuid()).min(1, 'Informe a ordem das fotos.'),
})

export const MAX_BULK_UPLOAD_FILES = 50
