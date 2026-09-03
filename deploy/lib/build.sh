#!/usr/bin/env bash

# npm ci omite devDependencies se NODE_ENV=production (comum no VPS).
npm_ci_dev() {
  deploy_log "Instalando dependências (npm ci + dev)..."
  rm -rf "$APP_DIR/apps/api/node_modules" "$APP_DIR/apps/web/node_modules" 2>/dev/null || true
  env -u NODE_ENV NODE_ENV=development npm ci --include=dev
}

bin_path() {
  local name="$1"
  local candidate

  for candidate in \
    "$APP_DIR/node_modules/.bin/$name" \
    "$APP_DIR/apps/api/node_modules/.bin/$name" \
    "$APP_DIR/apps/web/node_modules/.bin/$name"; do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

build_api() {
  deploy_log "Compilando API..."
  if bin_path tsc >/dev/null; then
    (cd apps/api && npx prisma generate && npx tsc -p tsconfig.json)
  else
    npm run build --workspace=paroquia-api
  fi
}

build_web() {
  deploy_log "Compilando frontend..."
  if bin_path turbo >/dev/null; then
    npx turbo run build --filter=paroquia-web
  else
    npm run build --workspace=paroquia-web
  fi
}

build_all() {
  if bin_path turbo >/dev/null; then
    deploy_log "Build (turbo)..."
    npx turbo run build
  else
    build_api
    build_web
  fi
}
