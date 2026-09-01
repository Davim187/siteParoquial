#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/siteParoquial}"
BRANCH="${DEPLOY_BRANCH:-master}"

cd "$APP_DIR"

if [ ! -f .env.production ]; then
  echo "Arquivo .env.production não encontrado. Copie .env.production.example e configure."
  exit 1
fi

echo "==> Atualizando código ($BRANCH)..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Subindo containers..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo "==> Aguardando API..."
sleep 8

echo "==> Rodando seed (idempotente)..."
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T api npx tsx prisma/seed.ts || true

echo "==> Deploy concluído."
docker compose -f docker-compose.prod.yml ps
