#!/usr/bin/env bash

require_pm2() {
  command -v pm2 >/dev/null 2>&1 \
    || deploy_die "PM2 não instalado — rode: bash deploy/setup.sh"
}

restart_api() {
  require_pm2
  deploy_log "Reiniciando API (PM2)..."
  mkdir -p "$APP_DIR/apps/api/uploads"
  load_env_file "$ENV_FILE"
  pm2 delete paroquia-api 2>/dev/null || true
  pm2 start "$APP_DIR/deploy/ecosystem.config.cjs" --update-env
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
      pm2 logs paroquia-api --lines 40 --nostream 2>/dev/null || true
      deploy_die "API não respondeu — rode: bash deploy/doctor.sh"
    fi
    sleep 2
  done
}
