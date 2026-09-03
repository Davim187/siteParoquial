import { z } from 'zod'

const patronessSchema = z.object({
  name: z.string(),
  history: z.string(),
  devotion: z.string(),
  medal: z.string(),
  feast: z.string(),
  traditions: z.string(),
  image: z.string(),
})

const feastProgramSchema = z.object({
  time: z.string(),
  title: z.string(),
  description: z.string().optional(),
})

const feastSchema = z.object({
  enabled: z.boolean(),
  title: z.string(),
  dateLabel: z.string(),
  description: z.string(),
  program: z.array(feastProgramSchema),
})

export const updateSettingsSchema = z
  .object({
    name: z.string().min(1).optional(),
    slogan: z.string().optional(),
    description: z.string().optional(),
    welcomeText: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email().or(z.literal('')).optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    youtube: z.string().optional(),
    secretaryHours: z.string().optional(),
    mapsUrl: z.string().optional(),
    mapLat: z.string().nullable().optional(),
    mapLng: z.string().nullable().optional(),
    pixKey: z.string().optional(),
    bankDetails: z.string().optional(),
    streamingUrl: z.string().optional(),
    history: z.string().optional(),
    mission: z.string().optional(),
    vision: z.string().optional(),
    patroness: patronessSchema.optional(),
    feast: feastSchema.optional(),
    logoMediaId: z.string().nullable().optional(),
    adminLogoMediaId: z.string().nullable().optional(),
    defaultMediaId: z.string().nullable().optional(),
    ogMediaId: z.string().nullable().optional(),
  })
  .strict()

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

export const publicSettingsSelect = {
  name: true,
  slogan: true,
  description: true,
  welcomeText: true,
  address: true,
  phone: true,
  whatsapp: true,
  email: true,
  instagram: true,
  facebook: true,
  youtube: true,
  secretaryHours: true,
  mapsUrl: true,
  mapLat: true,
  mapLng: true,
  pixKey: true,
  bankDetails: true,
  streamingUrl: true,
  history: true,
  mission: true,
  vision: true,
  patroness: true,
  feast: true,
} as const
