#!/usr/bin/env bash
# Copia TODOS os dados do banco local (dev) para produção (via túnel SSH).
# ⚠️  Sobrescreve os dados de produção.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_ENV="$ROOT/apps/api/.env"
PROD_ENV="$ROOT/apps/api/.env.production.local"
DUMP_FILE="${DUMP_FILE:-/tmp/paroquia-dev-to-prod.dump}"

read_env_var() {
  local file="$1" key="$2"
  grep -E "^${key}=" "$file" 2>/dev/null | tail -1 | cut -d= -f2- || true
}

parse_database_url() {
  local url="$1"
  node -e "
    const raw = process.argv[1];
    const u = new URL(raw.replace(/^postgresql:/, 'http:'));
    const db = u.pathname.replace(/^\//, '').split('?')[0];
    console.log([u.username, u.password, u.hostname, u.port || '5432', db].join('\t'));
  " "$url"
}

if [ ! -f "$DEV_ENV" ]; then
  echo "Arquivo não encontrado: $DEV_ENV"
  exit 1
fi

if [ ! -f "$PROD_ENV" ]; then
  echo "Arquivo não encontrado: $PROD_ENV"
  exit 1
fi

DEV_URL="$(read_env_var "$DEV_ENV" DATABASE_URL)"
PROD_URL="$(read_env_var "$PROD_ENV" DATABASE_URL)"

if [ -z "$DEV_URL" ] || [ -z "$PROD_URL" ]; then
  echo "DATABASE_URL ausente em .env ou .env.production.local"
  exit 1
fi

IFS=$'\t' read -r DEV_USER DEV_PASS DEV_HOST DEV_PORT DEV_DB <<< "$(parse_database_url "$DEV_URL")"
IFS=$'\t' read -r PROD_USER PROD_PASS PROD_HOST PROD_PORT PROD_DB <<< "$(parse_database_url "$PROD_URL")"

echo "==> Origem (dev):  ${DEV_USER}@${DEV_HOST}:${DEV_PORT}/${DEV_DB}"
echo "==> Destino (prod): ${PROD_USER}@${PROD_HOST}:${PROD_PORT}/${PROD_DB}"
echo
echo "⚠️  Isso APAGA e substitui todos os dados de PRODUÇÃO."
echo

if [ "${CONFIRM:-}" != "sim" ]; then
  read -r -p "Digite sim para continuar: " answer
  if [ "$answer" != "sim" ]; then
    echo "Cancelado."
    exit 0
  fi
fi

bash "$ROOT/scripts/ensure-db-tunnel.sh"

echo "==> Exportando banco de dev..."
PGPASSWORD="$DEV_PASS" pg_dump \
  -h "$DEV_HOST" -p "$DEV_PORT" -U "$DEV_USER" -d "$DEV_DB" \
  --format=custom --no-owner --no-acl \
  -f "$DUMP_FILE"

echo "==> Importando em produção..."
PGPASSWORD="$PROD_PASS" pg_restore \
  -h "$PROD_HOST" -p "$PROD_PORT" -U "$PROD_USER" -d "$PROD_DB" \
  --clean --if-exists --no-owner --no-acl \
  "$DUMP_FILE"

rm -f "$DUMP_FILE"

echo "==> Sincronização concluída."
echo "    Dados de dev copiados para produção."
