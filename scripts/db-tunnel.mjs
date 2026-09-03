#!/usr/bin/env node
import { closeSync, existsSync, openSync, readFileSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const ENV_FILE = process.env.ENV_FILE || join(ROOT, 'apps/api/.env.production.local')

export function readEnv(key, fallback = '') {
  if (!existsSync(ENV_FILE)) return fallback
  let found
  for (const line of readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) found = line.slice(key.length + 1)
  }
  return found === undefined || found === '' ? fallback : found
}

function decodeKeyBuffer(raw) {
  if (raw[0] === 0xff && raw[1] === 0xfe) return raw.subarray(2).toString('utf16le')
  if (raw[0] === 0xfe && raw[1] === 0xff) {
    const swapped = Buffer.alloc(raw.length - 2)
    for (let i = 2; i < raw.length; i += 2) {
      swapped[i - 2] = raw[i + 1]
      swapped[i - 1] = raw[i]
    }
    return swapped.toString('utf16le')
  }
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) return raw.subarray(3).toString('utf8')
  if (raw.subarray(0, 64).filter((b) => b === 0).length > 10) return raw.toString('utf16le')
  return raw.toString('utf8')
}

export function prepareSshKey(sourcePath) {
  const raw = readFileSync(sourcePath)
  const text = decodeKeyBuffer(raw)
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
  const first = text.split('\n')[0] || ''

  if (/^(ssh-rsa|ssh-ed25519|ecdsa-sha2|ssh-dss)\s/.test(first)) {
    throw new Error(
      `A chave ${sourcePath} é pública (começa com ${first.split(' ')[0]}). ` +
        'O túnel precisa da chave PRIVADA, com -----BEGIN OPENSSH PRIVATE KEY-----.',
    )
  }

  if (!/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/.test(text) || !/-----END [A-Z0-9 ]*PRIVATE KEY-----/.test(text)) {
    throw new Error(
      `A chave ${sourcePath} não tem o formato OpenSSH (BEGIN/END PRIVATE KEY). ` +
        'Copie o arquivo privado do Linux (~/.ssh/deploy_paroquia), não o .pub.',
    )
  }

  const normalized = `${text}\n`
  const prepared = join(tmpdir(), 'site-paroquial-deploy-key')
  writeFileSync(prepared, normalized, { encoding: 'utf8' })
  return prepared
}

export function pickSshKey(configured) {
  const source = findSshKeySource(configured)
  return source ? prepareSshKey(source) : ''
}

export function findSshKeySource(configured) {
  if (configured && existsSync(configured)) return configured
  for (const name of ['deploy_paroquia', 'id_ed25519', 'id_rsa']) {
    const candidate = join(homedir(), '.ssh', name)
    if (existsSync(candidate)) return candidate
  }
  return ''
}

export function getTunnelConfig() {
  const sshKeySource = findSshKeySource(readEnv('VPS_SSH_KEY', ''))
  return {
    vpsHost: readEnv('VPS_HOST', '84.46.251.102'),
    vpsUser: readEnv('VPS_USER', 'root'),
    localPort: readEnv('DB_TUNNEL_PORT', '15432'),
    sshKeySource,
    sshKey: sshKeySource ? prepareSshKey(sshKeySource) : '',
    remotePort: '5432',
  }
}

export function isPortOpen(port) {
  return new Promise((resolveOpen) => {
    const socket = createConnection({ host: '127.0.0.1', port: Number(port) }, () => {
      socket.end()
      resolveOpen(true)
    })
    socket.setTimeout(400, () => {
      socket.destroy()
      resolveOpen(false)
    })
    socket.on('error', () => resolveOpen(false))
  })
}

export function findSsh() {
  if (process.platform === 'win32') {
    const fallback = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'OpenSSH', 'ssh.exe')
    if (existsSync(fallback)) return fallback
  }
  return 'ssh'
}

function sshMissingMessage(err) {
  if (err.code === 'ENOENT') {
    if (process.platform === 'win32') {
      return 'Cliente SSH não encontrado. Instale o OpenSSH Client: Configurações → Aplicativos → Recursos opcionais.'
    }
    return 'Cliente SSH não encontrado. Instale o cliente OpenSSH (ex.: sudo apt install openssh-client).'
  }
  return err.message
}

export function startTunnel({ background = process.env.BACKGROUND === '1', logPath } = {}) {
  const { vpsHost, vpsUser, localPort, sshKey, sshKeySource, remotePort } = getTunnelConfig()
  const args = [
    '-N',
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ConnectTimeout=15',
    '-o', 'ServerAliveInterval=60',
    '-o', 'ExitOnForwardFailure=yes',
    '-L', `${localPort}:127.0.0.1:${remotePort}`,
  ]
  if (sshKey) {
    args.push('-i', sshKey, '-o', 'IdentitiesOnly=yes')
  }

  // ssh -f no Windows trava se stdin estiver fechado. No Linux o -f funciona.
  const useSshFork = background && process.platform !== 'win32'
  if (useSshFork) args.unshift('-f')

  console.log('==> Túnel Postgres produção')
  console.log(`    localhost:${localPort} → ${vpsUser}@${vpsHost}:${remotePort}`)
  if (sshKeySource) console.log(`    Chave SSH: ${sshKeySource}`)

  let logFd
  let stdio = 'inherit'
  if (logPath) {
    logFd = openSync(logPath, 'w')
    stdio = ['ignore', logFd, logFd]
  } else if (background && process.platform === 'win32') {
    stdio = 'ignore'
  }

  const child = spawn(findSsh(), [...args, `${vpsUser}@${vpsHost}`], {
    detached: background && process.platform === 'win32',
    stdio,
    windowsHide: background,
  })

  if (logFd !== undefined) {
    child.once('spawn', () => {
      try {
        closeSync(logFd)
      } catch {
        // already closed
      }
    })
  }

  if (background && process.platform === 'win32') {
    child.unref()
    return new Promise((resolveSpawn, reject) => {
      child.once('error', (err) => reject(new Error(sshMissingMessage(err))))
      child.once('spawn', () => resolveSpawn())
      child.once('exit', (code) => {
        if (code && code !== 0) reject(new Error(`ssh saiu com código ${code}`))
      })
    })
  }

  return new Promise((resolveExit, reject) => {
    child.on('error', (err) => reject(new Error(sshMissingMessage(err))))
    child.on('exit', (code) => {
      if (code === 0) resolveExit()
      else reject(new Error(`ssh saiu com código ${code ?? 1}`))
    })
  })
}

const isDirect =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url).toLowerCase() === resolve(process.argv[1]).toLowerCase()

if (isDirect) {
  startTunnel().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
