#!/usr/bin/env bash
# Abre o túnel SSH em background se api/.env.production.local existir
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/api/.env.production.local"

if [ "${USE_LOCAL_DB:-}" = "1" ] || [ ! -f "$ENV_FILE" ]; then
  exit 0
fi

read_env() {
  grep -E "^${1}=" "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- || true
}

LOCAL_PORT="$(read_env DB_TUNNEL_PORT)"
LOCAL_PORT="${LOCAL_PORT:-15432}"

port_open() {
  ss -tln 2>/dev/null | grep -q ":${LOCAL_PORT} "
}

if port_open; then
  exit 0
fi

echo "==> Abrindo túnel SSH para o banco de produção (porta ${LOCAL_PORT})..."

if ! BACKGROUND=1 bash "$ROOT/scripts/db-tunnel.sh" >/tmp/site-paroquial-tunnel.log 2>&1; then
  echo "==> Falha ao abrir túnel:"
  cat /tmp/site-paroquial-tunnel.log
  exit 1
fi

for _ in $(seq 1 15); do
  if port_open; then
    echo "==> Túnel ativo."
    exit 0
  fi
  sleep 1
done

echo "==> Túnel não respondeu a tempo. Log:"
cat /tmp/site-paroquial-tunnel.log
exit 1
