#!/usr/bin/env bash
# Diagnóstico completo do ambiente de produção.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT_DIR="$SCRIPT_DIR"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

deploy_init

echo "═══════════════════════════════════════"
echo " Diagnóstico — $APP_DIR"
echo "═══════════════════════════════════════"
echo

# ── .env ──
echo "▸ Variáveis (.env.production)"
if [ -f "$ENV_FILE" ]; then
  echo "   PUBLIC_URL  = $(read_env_value PUBLIC_URL "$ENV_FILE" 2>/dev/null || echo '(ausente)')"
  echo "   CORS_ORIGIN = $(read_env_value CORS_ORIGIN "$ENV_FILE" 2>/dev/null || echo '(ausente)')"
  echo "   Domínio SSL = $(domain_from_env "$ENV_FILE" 2>/dev/null || echo '(use domínio, não IP)')"
  echo "   ACME_EMAIL  = $(read_env_value ACME_EMAIL "$ENV_FILE" 2>/dev/null || echo '(ausente)')"
else
  echo "   ERRO — $ENV_FILE não encontrado"
fi
echo

# ── Build ──
echo "▸ Build"
[ -f "$APP_DIR/apps/api/dist/server.js" ] && echo "   API dist   OK" || echo "   API dist   ERRO"
[ -d "$APP_DIR/apps/web/dist" ] && echo "   Web dist   OK" || echo "   Web dist   ERRO"
[ -x "$APP_DIR/node_modules/.bin/tsc" ] && echo "   TypeScript OK" || echo "   TypeScript ERRO (rode: NODE_ENV=development npm ci)"
echo

# ── Postgres ──
echo "▸ Postgres"
if [ -f "$ENV_FILE" ]; then
  compose ps postgres 2>/dev/null || echo "   Container não encontrado"
  POSTGRES_PORT="$(read_env_value POSTGRES_PORT "$ENV_FILE" 2>/dev/null || echo 5432)"
  if ss -tlnp 2>/dev/null | grep -q "127.0.0.1:${POSTGRES_PORT}"; then
    echo "   Porta ${POSTGRES_PORT} OK (127.0.0.1)"
  else
    echo "   Porta ${POSTGRES_PORT} ERRO"
  fi
fi
echo

# ── API / PM2 ──
echo "▸ API (PM2)"
if command -v pm2 >/dev/null 2>&1; then
  pm2 status paroquia-api 2>/dev/null || echo "   paroquia-api não registrada"
else
  echo "   PM2 não instalado"
fi

if ss -tlnp 2>/dev/null | grep -q ':3333 '; then
  echo "   Porta 3333 OK"
  curl -fsS http://127.0.0.1:3333/api/health 2>/dev/null && echo || echo "   /api/health ERRO"
else
  echo "   Porta 3333 ERRO — API offline"
  echo "   Rode: bash deploy/deploy.sh api"
fi

if [ -f "$APP_DIR/logs/api-error.log" ]; then
  echo "   Últimas linhas de logs/api-error.log:"
  tail -5 "$APP_DIR/logs/api-error.log" 2>/dev/null | sed 's/^/     /' || true
fi
echo

# ── Apache / SSL ──
echo "▸ Apache / SSL"
systemctl is-active apache2 >/dev/null 2>&1 && echo "   Apache     OK" || echo "   Apache     ERRO"
a2query -s 2>/dev/null | sed 's/^/   /' || true

DOMAIN="$(domain_from_env "$ENV_FILE" 2>/dev/null || true)"
if [ -n "$DOMAIN" ]; then
  if ssl_cert_exists "$DOMAIN"; then
    echo "   Certificado OK ($DOMAIN)"
    openssl x509 -in "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" -noout -dates 2>/dev/null | sed 's/^/   /' || true
  else
    echo "   Certificado ERRO — rode: bash deploy/deploy.sh ssl"
  fi

  curl -sI --max-time 5 "https://${DOMAIN}/api/health" 2>/dev/null | head -1 | sed 's/^/   HTTPS /' \
    || echo "   HTTPS ERRO"
fi

LISTEN443="$(grep -cE 'Listen 443' /etc/apache2/ports.conf 2>/dev/null || echo 0)"
[ "$LISTEN443" -le 1 ] || echo "   AVISO — Listen 443 duplicado em ports.conf"

apache2ctl configtest 2>&1 | sed 's/^/   /' || true
echo

echo "═══════════════════════════════════════"
echo " Correção rápida: bash deploy/deploy.sh"
echo "═══════════════════════════════════════"
