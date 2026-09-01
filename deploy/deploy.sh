#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_DIR="$(resolve_app_dir)"
BRANCH="${DEPLOY_BRANCH:-master}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"

cd "$APP_DIR"
validate_env_production "$ENV_FILE"

echo "==> Diretório do projeto: $APP_DIR"

echo "==> Atualizando código ($BRANCH)..."
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Liberando porta 80..."
bash deploy/remove-apache.sh

echo "==> Subindo containers..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d --build

echo "==> Aguardando Postgres..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" exec -T postgres \
  sh -c 'until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do sleep 1; done'

echo "==> Rodando migrations..."
for attempt in $(seq 1 20); do
  if docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" exec -T api npx prisma migrate deploy; then
    break
  fi
  if [ "$attempt" -eq 20 ]; then
    echo "Falha ao aplicar migrations. Logs da API:"
    docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" logs api --tail 80
    exit 1
  fi
  echo "   Tentativa ${attempt}/20 — aguardando API..."
  sleep 3
done

echo "==> Rodando seed..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" exec -T api npx tsx prisma/seed.ts

echo "==> Deploy concluído."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" ps
