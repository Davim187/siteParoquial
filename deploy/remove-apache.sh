#!/usr/bin/env bash
# DEPRECATED: o deploy atual usa Apache no host. Este script só existe para
# limpar instalações antigas (Docker/Caddy/Nginx) que ocupavam a porta 80.
set -euo pipefail

echo "AVISO: o deploy atual usa Apache. Este script para serviços conflitantes."

echo "==> Parando containers Docker antigos (web/api/caddy)..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-/www}"
if [ -f "$APP_DIR/docker-compose.prod.yml" ]; then
  docker compose -f "$APP_DIR/docker-compose.prod.yml" stop 2>/dev/null || true
fi

echo "==> Parando Nginx do sistema (Apache permanece)..."
for service in httpd nginx; do
  if systemctl is-active --quiet "$service" 2>/dev/null; then
    echo "   Parando $service..."
    systemctl stop "$service"
  fi
  if systemctl is-enabled --quiet "$service" 2>/dev/null; then
    echo "   Desabilitando $service..."
    systemctl disable "$service"
  fi
done

echo "==> Verificando porta 80..."
if ss -tlnp | grep -q ':80 '; then
  ss -tlnp | grep ':80 ' || true
else
  echo "Porta 80 livre."
fi

echo "==> Concluído."
