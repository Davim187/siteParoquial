const fs = require('node:fs')
const path = require('node:path')

const appDir = process.env.APP_DIR || path.resolve(__dirname, '..')
const apiDir = path.join(appDir, 'apps/api')
const logsDir = path.join(appDir, 'logs')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}

  const env = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const sep = trimmed.indexOf('=')
    if (sep === -1) continue
    const key = trimmed.slice(0, sep)
    let value = trimmed.slice(sep + 1)
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const fileEnv = loadEnvFile(path.join(appDir, '.env.production'))
const uploadDirName = fileEnv.UPLOAD_DIR || 'uploads'

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const productionEnv = {
  NODE_ENV: 'production',
  HOST: '0.0.0.0',
  PORT: '3333',
  ...fileEnv,
  UPLOAD_DIR: path.isAbsolute(uploadDirName)
    ? uploadDirName
    : path.join(apiDir, uploadDirName),
}

module.exports = {
  apps: [
    {
      name: 'paroquia-api',
      cwd: apiDir,
      script: 'dist/server.js',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1024M',
      error_file: path.join(logsDir, 'api-error.log'),
      out_file: path.join(logsDir, 'api-out.log'),
      merge_logs: true,
      time: true,
      env: productionEnv,
    },
  ],
}
