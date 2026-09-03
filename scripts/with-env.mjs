#!/usr/bin/env node
import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
const env = { ...process.env }
const cmd = []

for (const arg of args) {
  if (cmd.length === 0 && /^[A-Za-z_][A-Za-z0-9_]*=/.test(arg)) {
    const eq = arg.indexOf('=')
    env[arg.slice(0, eq)] = arg.slice(eq + 1)
  } else {
    cmd.push(arg)
  }
}

if (cmd.length === 0) {
  console.error('Uso: node scripts/with-env.mjs CHAVE=valor comando [args...]')
  process.exit(1)
}

const child = spawn(cmd[0], cmd.slice(1), {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
})

child.on('exit', (code) => process.exit(code ?? 1))
child.on('error', (err) => {
  console.error(err.message)
  process.exit(1)
})
