const path = require('node:path')

const appDir = process.env.APP_DIR || '/www'

module.exports = {
  apps: [
    {
      name: 'paroquia-api',
      cwd: path.join(appDir, 'apps/api'),
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
