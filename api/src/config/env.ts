import './load-env.js'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_EXPIRES_DAYS: z.coerce.number().default(7),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary', 'r2']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  PUBLIC_URL: z.string().default('http://localhost:3333'),
  MAX_UPLOAD_MB: z.coerce.number().default(8),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
