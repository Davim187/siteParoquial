#!/usr/bin/env node
/**
 * Testa se a API sobe e responde /api/health antes do PM2.
 * Uso: APP_DIR=/var/www node deploy/scripts/test-api-boot.mjs
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appDir = process.env.APP_DIR || join(__dirname, '../..')
const require = createRequire(import.meta.url)

const config = require(join(appDir, 'deploy/ecosystem.config.cjs'))
const app = config.apps[0]
const apiDir = join(appDir, 'apps/api')
const env = { ...process.env, ...app.env }

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const proc = spawn('node', ['dist/server.js'], {
  cwd: apiDir,
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
})

let stderr = ''
proc.stderr.on('data', (chunk) => {
  stderr += chunk
  process.stderr.write(chunk)
})

proc.on('exit', (code) => {
  if (code !== null && code !== 0 && code !== 143 && code !== 130) {
    console.error(`\nProcesso encerrou com código ${code}`)
    process.exit(1)
  }
})

for (let attempt = 1; attempt <= 15; attempt++) {
  await sleep(1000)
  try {
    const res = await fetch('http://127.0.0.1:3333/api/health')
    if (res.ok) {
      const body = await res.text()
      console.log(`Boot OK: ${body}`)
      proc.kill('SIGTERM')
      await sleep(500)
      process.exit(0)
    }
  } catch {
    // aguarda
  }
}

console.error('\nBoot FALHOU — API não respondeu em 15s')
if (stderr) console.error('\n--- stderr ---\n', stderr)
proc.kill('SIGKILL')
process.exit(1)
