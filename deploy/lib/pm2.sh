#!/usr/bin/env bash

require_pm2() {
  command -v pm2 >/dev/null 2>&1 \
    || deploy_die "PM2 não instalado — rode: bash deploy/setup.sh"
}

prepare_api_runtime() {
  deploy_log "Preparando runtime da API..."
  mkdir -p "$APP_DIR/apps/api/uploads" "$APP_DIR/logs"
  (cd apps/api && npx prisma generate)
  [ -f "$APP_DIR/apps/api/dist/server.js" ] \
    || deploy_die "dist/server.js ausente — rode: bash deploy/deploy.sh api"
}

test_api_boot() {
  deploy_log "Teste de boot da API..."
  export APP_DIR
  if ! node "$APP_DIR/deploy/scripts/test-api-boot.mjs"; then
    deploy_die "API falhou no boot — veja logs em $APP_DIR/logs/"
  fi
}

restart_api() {
  require_pm2
  prepare_api_runtime
  test_api_boot

  deploy_log "Iniciando PM2..."
  export APP_DIR
  pm2 delete paroquia-api 2>/dev/null || true
  APP_DIR="$APP_DIR" pm2 start "$APP_DIR/deploy/ecosystem.config.cjs"
  pm2 save
}

wait_api_health() {
  deploy_log "Aguardando API (porta 3333)..."
  local attempt
  for attempt in $(seq 1 20); do
    if curl -fsS http://127.0.0.1:3333/api/health >/dev/null 2>&1; then
      deploy_log "API online"
      return 0
    fi
    if [ "$attempt" -eq 20 ]; then
      echo "--- pm2 logs ---"
      pm2 logs paroquia-api --lines 30 --nostream 2>/dev/null || true
      echo "--- logs/api-error.log ---"
      tail -30 "$APP_DIR/logs/api-error.log" 2>/dev/null || true
      deploy_die "API offline — rode: bash deploy/doctor.sh"
    fi
    sleep 2
  done
}
