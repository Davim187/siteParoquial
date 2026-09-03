import dotenv from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const monorepoRoot = resolve(apiRoot, '..')

const productionEnvPath = resolve(apiRoot, '.env.production.local')
const rootProductionEnvPath = resolve(monorepoRoot, '.env.production')
const useLocalDb = process.env.USE_LOCAL_DB === '1'
const localEnvPath = resolve(apiRoot, '.env')
const inProduction = process.env.NODE_ENV === 'production'

if (existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath })
} else if (!inProduction) {
  console.error('Crie apps/api/.env a partir de apps/api/.env.example (cp no Linux, copy no Windows).')
  console.error('O JWT_SECRET e as outras configs da API vêm desse arquivo.')
  process.exit(1)
}

if (inProduction && existsSync(rootProductionEnvPath)) {
  dotenv.config({ path: rootProductionEnvPath })
}

export function usesProductionDb(): boolean {
  return !useLocalDb && existsSync(productionEnvPath)
}

if (usesProductionDb()) {
  dotenv.config({ path: productionEnvPath, override: true })

  if (process.env.DATABASE_URL?.includes('SUA_SENHA')) {
    console.error('Edite apps/api/.env.production.local — substitua SUA_SENHA_PRODUCAO pela senha do VPS.')
    process.exit(1)
  }

  console.info('[db] Produção (apps/api/.env.production.local)')
}




