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

echo "==> Aguardando API..."
sleep 8

echo "==> Rodando seed (idempotente)..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" exec -T api npx tsx prisma/seed.ts || true

echo "==> Deploy concluído."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" ps
