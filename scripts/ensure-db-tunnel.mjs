#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ENV_FILE, getTunnelConfig, isPortOpen, startTunnel } from './db-tunnel.mjs'

if (process.env.USE_LOCAL_DB === '1' || !existsSync(ENV_FILE)) {
  process.exit(0)
}

let localPort
try {
  ({ localPort } = getTunnelConfig())
} catch (err) {
  console.error(err.message)
  process.exit(1)
}

if (await isPortOpen(localPort)) {
  process.exit(0)
}

const logPath = join(tmpdir(), 'site-paroquial-tunnel.log')

console.log(`==> Abrindo túnel SSH para o banco de produção (porta ${localPort})...`)

try {
  await startTunnel({ background: true, logPath })
} catch (err) {
  console.error('==> Falha ao abrir túnel:')
  try {
    process.stderr.write(readFileSync(logPath, 'utf8'))
  } catch {
    console.error(err.message)
  }
  process.exit(1)
}

for (let i = 0; i < 15; i += 1) {
  if (await isPortOpen(localPort)) {
    console.log('==> Túnel ativo.')
    process.exit(0)
  }
  await new Promise((r) => setTimeout(r, 1000))
}

console.error('==> Túnel não respondeu a tempo. Log:')
try {
  process.stderr.write(readFileSync(logPath, 'utf8'))
} catch {
  console.error('(sem log)')
}
process.exit(1)
