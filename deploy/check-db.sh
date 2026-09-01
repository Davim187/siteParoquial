#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_DIR="$(resolve_app_dir)"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
COMPOSE=(docker compose -f "$APP_DIR/docker-compose.prod.yml" --env-file "$ENV_FILE")

cd "$APP_DIR"

echo "==> Projeto: $APP_DIR"
echo

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: $ENV_FILE não encontrado"
  exit 1
fi

POSTGRES_USER="$(read_env_value POSTGRES_USER "$ENV_FILE" 2>/dev/null || echo paroquia)"
POSTGRES_DB="$(read_env_value POSTGRES_DB "$ENV_FILE" 2>/dev/null || echo paroquia)"
POSTGRES_PASSWORD="$(read_env_value POSTGRES_PASSWORD "$ENV_FILE")"
POSTGRES_PORT="$(read_env_value POSTGRES_PORT "$ENV_FILE" 2>/dev/null || echo 5432)"

echo "==> Variáveis"
echo "   POSTGRES_USER=$POSTGRES_USER"
echo "   POSTGRES_DB=$POSTGRES_DB"
echo "   POSTGRES_PORT=$POSTGRES_PORT"
echo "   POSTGRES_PASSWORD=*** (${#POSTGRES_PASSWORD} caracteres)"
echo

echo "==> Containers"
"${COMPOSE[@]}" ps postgres
echo

echo "==> Porta no VPS (deve ser 127.0.0.1:${POSTGRES_PORT})"
if ss -tlnp 2>/dev/null | grep -q "127.0.0.1:${POSTGRES_PORT}"; then
  ss -tlnp | grep "127.0.0.1:${POSTGRES_PORT}" || true
  echo "   OK — porta exposta localmente"
else
  echo "   ERRO — porta ${POSTGRES_PORT} não está em 127.0.0.1"
  echo "   Rode: docker compose -f docker-compose.prod.yml --env-file .env.production up -d"
fi
echo

echo "==> Teste de login no Postgres"
if PGPASSWORD="$POSTGRES_PASSWORD" "${COMPOSE[@]}" exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'SELECT 1 AS ok;' >/dev/null 2>&1; then
  echo "   OK — senha do .env.production funciona"
else
  echo "   ERRO — senha do .env.production NÃO funciona no banco"
  echo "   Corrija com:"
  echo "   ${COMPOSE[*]} exec postgres psql -U postgres -d $POSTGRES_DB -c \"ALTER USER $POSTGRES_USER WITH PASSWORD 'SUA_SENHA';\""
fi
echo

echo "==> Beekeeper (túnel SSH manual — recomendado no Linux Snap)"
echo "   No seu PC, deixe este terminal aberto:"
echo "   ssh -N -L ${POSTGRES_PORT}:127.0.0.1:${POSTGRES_PORT} root@SEU_IP_VPS"
echo
echo "   No Beekeeper (SEM aba SSH Tunnel):"
echo "   Host=127.0.0.1  Port=${POSTGRES_PORT}  User=$POSTGRES_USER  Database=$POSTGRES_DB"
echo "   Password = mesma de POSTGRES_PASSWORD no .env.production"
