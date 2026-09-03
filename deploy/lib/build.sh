#!/usr/bin/env bash

# npm ci omite devDependencies quando NODE_ENV=production (quebra tsc/turbo).
npm_ci_dev() {
  deploy_log "Instalando dependências (npm ci)..."
  NODE_ENV=development npm ci
}

build_api() {
  deploy_log "Prisma generate..."
  (cd apps/api && npx prisma generate)

  deploy_log "Compilando API..."
  [ -x "$APP_DIR/node_modules/.bin/tsc" ] \
    || deploy_die "TypeScript não instalado — rode npm ci com devDependencies"

  "$APP_DIR/node_modules/.bin/tsc" -p apps/api/tsconfig.json
}

build_web() {
  deploy_log "Compilando frontend..."
  if [ -x "$APP_DIR/node_modules/.bin/turbo" ]; then
    npx turbo run build --filter=paroquia-web
  else
    npm run build --workspace=paroquia-web
  fi
}

build_all() {
  if [ -x "$APP_DIR/node_modules/.bin/turbo" ]; then
    deploy_log "Build (turbo)..."
    npx turbo run build
  else
    build_api
    build_web
  fi
}
