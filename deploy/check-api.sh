#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_DIR="${APP_DIR:-$(resolve_app_dir)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
export APP_DIR

echo "==> Diagnóstico API"
echo "   APP_DIR = $APP_DIR"
echo

echo "==> PM2"
if command -v pm2 >/dev/null 2>&1; then
  pm2 status paroquia-api 2>/dev/null || pm2 status
else
  echo "   ERRO — PM2 não instalado"
fi
echo

echo "==> Porta 3333"
if ss -tlnp | grep -q ':3333 '; then
  ss -tlnp | grep ':3333 ' || true
  echo "   OK — processo escutando na 3333"
else
  echo "   ERRO — nada escutando na porta 3333"
fi
echo

echo "==> Teste direto (localhost:3333)"
if curl -fsS --max-time 5 http://127.0.0.1:3333/api/health; then
  echo
  echo "   OK"
else
  echo "   ERRO — API não responde localmente"
  echo "   Logs:"
  pm2 logs paroquia-api --lines 30 --nostream 2>/dev/null || true
fi
echo

echo "==> Teste via Apache (/api/health)"
DOMAIN="$(domain_from_env "$ENV_FILE" 2>/dev/null || echo paroquiansdasgracas.com.br)"
curl -sI --max-time 8 "https://${DOMAIN}/api/health" | head -5 || true
echo

echo "==> Arquivos"
if [ -f "$APP_DIR/apps/api/dist/server.js" ]; then
  echo "   OK — dist/server.js existe"
else
  echo "   ERRO — rode: npm run build"
fi

if [ -f "$ENV_FILE" ]; then
  echo "   OK — $ENV_FILE existe"
  grep -E '^(DATABASE_URL|JWT_SECRET|CORS_ORIGIN)=' "$ENV_FILE" | sed 's/=.*/=***/' || true
else
  echo "   ERRO — $ENV_FILE não encontrado"
fi

echo
echo "==> Corrigir"
echo "   cd $APP_DIR"
echo "   pm2 delete paroquia-api 2>/dev/null || true"
echo "   pm2 start deploy/ecosystem.config.cjs --update-env"
echo "   pm2 save"
