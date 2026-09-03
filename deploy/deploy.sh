#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_DIR="$(resolve_app_dir)"
BRANCH="${DEPLOY_BRANCH:-master}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
export APP_DIR

cd "$APP_DIR"
validate_env_production "$ENV_FILE"

echo "==> Diretório do projeto: $APP_DIR"

echo "==> Atualizando código ($BRANCH)..."
git_sync_branch "$BRANCH"

echo "==> Subindo Postgres (Docker)..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d postgres

echo "==> Instalando dependências..."
npm ci

echo "==> Build web + API..."
npm run build

echo "==> Aguardando Postgres..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" exec -T postgres \
  sh -c 'until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do sleep 1; done'

echo "==> Rodando migrations..."
load_env_file "$ENV_FILE"
for attempt in $(seq 1 20); do
  if (cd apps/api && npx prisma migrate deploy); then
    break
  fi
  if [ "$attempt" -eq 20 ]; then
    echo "Falha ao aplicar migrations. Logs da API:"
    pm2 logs paroquia-api --lines 80 --nostream 2>/dev/null || true
    exit 1
  fi
  echo "   Tentativa ${attempt}/20 — aguardando banco..."
  sleep 3
done

echo "==> Configurando Apache..."
bash deploy/setup-apache.sh

echo "==> Reiniciando API (PM2)..."
if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 não encontrado. Rode: bash deploy/setup-server.sh"
  exit 1
fi

load_env_file "$ENV_FILE"
pm2 startOrReload "$APP_DIR/deploy/ecosystem.config.cjs" --update-env
pm2 save

echo "==> Deploy concluído."
pm2 status
systemctl is-active apache2 && echo "Apache: ativo"
