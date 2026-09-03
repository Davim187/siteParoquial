#!/usr/bin/env node
import { existsSync, unlinkSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ROOT } from './db-tunnel.mjs'
import { readFileSync } from 'node:fs'

const DEV_ENV = join(ROOT, 'apps/api/.env')
const PROD_ENV = join(ROOT, 'apps/api/.env.production.local')
const DUMP_FILE = process.env.DUMP_FILE || join(tmpdir(), 'paroquia-dev-to-prod.dump')

function readEnvVar(file, key) {
  if (!existsSync(file)) return ''
  let found = ''
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) found = line.slice(key.length + 1)
  }
  return found
}

function parseDatabaseUrl(url) {
  const u = new URL(url.replace(/^postgresql:/, 'http:'))
  const db = u.pathname.replace(/^\//, '').split('?')[0]
  return {
    user: decodeURIComponent(u.username),
    pass: decodeURIComponent(u.password),
    host: u.hostname,
    port: u.port || '5432',
    db,
  }
}

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
      shell: process.platform === 'win32',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} saiu com código ${code}`))
    })
  })
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

if (!existsSync(DEV_ENV)) {
  console.error(`Arquivo não encontrado: ${DEV_ENV}`)
  process.exit(1)
}

if (!existsSync(PROD_ENV)) {
  console.error(`Arquivo não encontrado: ${PROD_ENV}`)
  process.exit(1)
}

const devUrl = readEnvVar(DEV_ENV, 'DATABASE_URL')
const prodUrl = readEnvVar(PROD_ENV, 'DATABASE_URL')

if (!devUrl || !prodUrl) {
  console.error('DATABASE_URL ausente em .env ou .env.production.local')
  process.exit(1)
}

const dev = parseDatabaseUrl(devUrl)
const prod = parseDatabaseUrl(prodUrl)

console.log(`==> Origem (dev):  ${dev.user}@${dev.host}:${dev.port}/${dev.db}`)
console.log(`==> Destino (prod): ${prod.user}@${prod.host}:${prod.port}/${prod.db}`)
console.log()
console.log('⚠️  Isso APAGA e substitui todos os dados de PRODUÇÃO.')
console.log()

if (process.env.CONFIRM !== 'sim') {
  const answer = await ask('Digite sim para continuar: ')
  if (answer !== 'sim') {
    console.log('Cancelado.')
    process.exit(0)
  }
}

await run(process.execPath, [join(ROOT, 'scripts/ensure-db-tunnel.mjs')])

console.log('==> Exportando banco de dev...')
await run(
  'pg_dump',
  [
    '-h', dev.host,
    '-p', dev.port,
    '-U', dev.user,
    '-d', dev.db,
    '--format=custom',
    '--no-owner',
    '--no-acl',
    '-f', DUMP_FILE,
  ],
  { PGPASSWORD: dev.pass },
)

console.log('==> Importando em produção...')
await run(
  'pg_restore',
  [
    '-h', prod.host,
    '-p', prod.port,
    '-U', prod.user,
    '-d', prod.db,
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-acl',
    DUMP_FILE,
  ],
  { PGPASSWORD: prod.pass },
)

try {
  unlinkSync(DUMP_FILE)
} catch {
  // ignore
}

console.log('==> Sincronização concluída.')
console.log('    Dados de dev copiados para produção.')
