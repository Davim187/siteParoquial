#!/usr/bin/env bash
# Túnel SSH: Postgres de produção no VPS → localhost
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/api/.env.production.local}"
BACKGROUND="${BACKGROUND:-0}"

read_env() {
  local key="$1" default="$2"
  if [ -f "$ENV_FILE" ]; then
    local line
    line="$(grep -E "^${key}=" "$ENV_FILE" | tail -1 || true)"
    if [ -n "$line" ]; then
      printf '%s' "${line#*=}"
      return
    fi
  fi
  printf '%s' "$default"
}

pick_ssh_key() {
  local configured="$1"
  if [ -n "$configured" ] && [ -f "$configured" ]; then
    printf '%s' "$configured"
    return
  fi
  for candidate in "$HOME/.ssh/deploy_paroquia" "$HOME/.ssh/id_ed25519" "$HOME/.ssh/id_rsa"; do
    if [ -f "$candidate" ]; then
      printf '%s' "$candidate"
      return
    fi
  done
}

VPS_HOST="$(read_env VPS_HOST "84.46.251.102")"
VPS_USER="$(read_env VPS_USER "root")"
LOCAL_PORT="$(read_env DB_TUNNEL_PORT "15432")"
SSH_KEY="$(pick_ssh_key "$(read_env VPS_SSH_KEY "")")"
REMOTE_PORT="5432"

SSH_OPTS=(
  -N
  -o "StrictHostKeyChecking=accept-new"
  -o "ConnectTimeout=15"
  -o "ServerAliveInterval=60"
  -o "ExitOnForwardFailure=yes"
  -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}"
)

if [ -n "$SSH_KEY" ]; then
  SSH_OPTS+=(-i "$SSH_KEY")
fi

if [ "$BACKGROUND" = "1" ]; then
  SSH_OPTS=(-f "${SSH_OPTS[@]}")
fi

echo "==> Túnel Postgres produção"
echo "    localhost:${LOCAL_PORT} → ${VPS_USER}@${VPS_HOST}:${REMOTE_PORT}"
if [ -n "$SSH_KEY" ]; then
  echo "    Chave SSH: ${SSH_KEY}"
fi

exec ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}"
