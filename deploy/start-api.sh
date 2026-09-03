#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_DIR="${APP_DIR:-$(resolve_app_dir)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
export APP_DIR

cd "$APP_DIR"

echo "==> Iniciando API (PM2)"
echo "   APP_DIR=$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: $ENV_FILE não encontrado"
  exit 1
fi

echo "==> Instalando dependências (npm ci)..."
npm ci

echo "==> Prisma generate + build da API..."
npm run build --workspace=paroquia-api

if [ ! -f "$APP_DIR/apps/api/dist/server.js" ]; then
  echo "ERRO: build não gerou apps/api/dist/server.js"
  exit 1
fi

mkdir -p "$APP_DIR/apps/api/uploads"

echo "==> Postgres..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d postgres

echo "==> Migrations..."
load_env_file "$ENV_FILE"
(cd apps/api && npx prisma migrate deploy)

echo "==> PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERRO: PM2 não instalado. Rode: bash deploy/setup-server.sh"
  exit 1
fi

pm2 delete paroquia-api 2>/dev/null || true
pm2 start "$APP_DIR/deploy/ecosystem.config.cjs" --update-env
pm2 save

sleep 2

echo "==> Aguardando API na porta 3333..."
for attempt in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:3333/api/health >/dev/null 2>&1; then
    echo "   OK — API online"
    curl -fsS http://127.0.0.1:3333/api/health
    echo
    pm2 status paroquia-api
    exit 0
  fi
  if [ "$attempt" -eq 20 ]; then
    echo "ERRO: API não subiu. Logs:"
    pm2 logs paroquia-api --lines 40 --nostream || true
    echo
    echo "Teste manual:"
    echo "  cd $APP_DIR && NODE_ENV=production node apps/api/dist/server.js"
    exit 1
  fi
  sleep 2
done
