import dotenv from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const productionEnvPath = resolve(apiRoot, '.env.production.local')
const useLocalDb = process.env.USE_LOCAL_DB === '1'

dotenv.config({ path: resolve(apiRoot, '.env') })

export function usesProductionDb(): boolean {
  return !useLocalDb && existsSync(productionEnvPath)
}

if (usesProductionDb()) {
  dotenv.config({ path: productionEnvPath, override: true })

  if (process.env.DATABASE_URL?.includes('SUA_SENHA')) {
    console.error('Edite api/.env.production.local — substitua SUA_SENHA_PRODUCAO pela senha do VPS.')
    process.exit(1)
  }

  console.info('[db] Produção (api/.env.production.local)')
}
