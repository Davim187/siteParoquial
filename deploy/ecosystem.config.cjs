const fs = require('node:fs')
const path = require('node:path')

const appDir = process.env.APP_DIR || path.resolve(__dirname, '..')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const env = {}

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator)
    let value = trimmed.slice(separator + 1)

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

const productionEnv = {
  NODE_ENV: 'production',
  ...loadEnvFile(path.join(appDir, '.env.production')),
}

module.exports = {
  apps: [
    {
      name: 'paroquia-api',
      cwd: path.join(appDir, 'apps/api'),
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: productionEnv,
    },
  ],
}
