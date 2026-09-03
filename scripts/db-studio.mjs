#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ENV_FILE } from './db-tunnel.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const API = join(ROOT, 'apps/api')
const LOCAL_ENV = join(API, '.env')
const PRISMA_CLI = join(API, 'node_modules/prisma/build/index.js')
const useLocal = process.env.USE_LOCAL_DB === '1' || process.argv.includes('--local')

function readKey(file, key) {
  if (!existsSync(file)) return ''
  let found = ''
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) found = line.slice(key.length + 1).trim()
  }
  return found
}

function run(cmd, args, options = {}) {
  return new Promise((resolveExit, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      ...options,
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolveExit()
      else reject(new Error(`${cmd} saiu com código ${code}`))
    })
  })
}

const productionUrl = readKey(ENV_FILE, 'DATABASE_URL')
const localUrl = readKey(LOCAL_ENV, 'DATABASE_URL')
const databaseUrl = !useLocal && productionUrl ? productionUrl : localUrl

if (!databaseUrl) {
  console.error('DATABASE_URL não encontrado. Configure apps/api/.env ou .env.production.local')
  process.exit(1)
}

if (!useLocal && productionUrl) {
  await run(process.execPath, [join(ROOT, 'scripts/ensure-db-tunnel.mjs')], { cwd: ROOT })
  const host = databaseUrl.includes(':15432') ? 'túnel 127.0.0.1:15432' : 'produção'
  console.log(`==> Prisma Studio no banco do SERVIDOR (${host})`)
} else {
  console.log('==> Prisma Studio no banco LOCAL')
}
console.log('    http://127.0.0.1:5555')

const child = spawn(
  process.execPath,
  [PRISMA_CLI, 'studio', '--hostname', '127.0.0.1', '--port', '5555'],
  {
    cwd: API,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  },
)

child.on('exit', (code) => process.exit(code ?? 1))
child.on('error', (err) => {
  console.error(err.message)
  process.exit(1)
})
