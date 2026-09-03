#!/usr/bin/env bash

compose() {
  docker compose -f "$APP_DIR/docker-compose.prod.yml" --env-file "$ENV_FILE" "$@"
}

postgres_up() {
  deploy_log "Subindo Postgres..."
  compose up -d postgres
}

postgres_wait() {
  deploy_log "Aguardando Postgres..."
  compose exec -T postgres \
    sh -c 'until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do sleep 1; done'
}

migrate_deploy() {
  deploy_log "Aplicando migrations..."
  load_env_file "$ENV_FILE"

  local attempt
  for attempt in $(seq 1 20); do
    if (cd apps/api && npx prisma migrate deploy); then
      return 0
    fi
    if [ "$attempt" -eq 20 ]; then
      deploy_die "Falha ao aplicar migrations"
    fi
    printf '   tentativa %s/20...\n' "$attempt"
    sleep 3
  done
}
