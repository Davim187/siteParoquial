#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"
# shellcheck source=apache/render-config.sh
source "$SCRIPT_DIR/apache/render-config.sh"

APP_DIR="${APP_DIR:-$(resolve_app_dir)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"

DOMAIN="$(domain_from_env "$ENV_FILE" 2>/dev/null || true)"
HOST="$(host_from_env "$ENV_FILE" 2>/dev/null || true)"
PUBLIC_URL_VAL="$(read_env_value PUBLIC_URL "$ENV_FILE" 2>/dev/null || true)"
CORS_ORIGIN_VAL="$(read_env_value CORS_ORIGIN "$ENV_FILE" 2>/dev/null || true)"

echo "==> Diagnóstico SSL"
echo "   PUBLIC_URL  = ${PUBLIC_URL_VAL:-(não definido)}"
echo "   CORS_ORIGIN = ${CORS_ORIGIN_VAL:-(não definido)}"
echo "   Domínio SSL = ${DOMAIN:-(nenhum — use o domínio, não o IP)}"
echo

if [ -z "$DOMAIN" ]; then
  echo "==> PROBLEMA: PUBLIC_URL/CORS_ORIGIN usam IP ou estão vazios."
  echo "   Let's Encrypt precisa de um domínio (ex.: paroquiansdasgracas.com.br)."
  echo
  echo "   Edite $ENV_FILE:"
  echo "     PUBLIC_URL=https://paroquiansdasgracas.com.br"
  echo "     CORS_ORIGIN=https://paroquiansdasgracas.com.br"
  echo
  echo "   Depois: bash deploy/setup-ssl.sh"
  echo
fi

echo "==> Portas em uso"
ss -tlnp | grep -E ':80 |:443 ' || echo "   Nenhuma porta 80/443 encontrada"
echo

echo "==> Sites Apache habilitados"
a2query -s 2>/dev/null || ls -la /etc/apache2/sites-enabled/
echo

echo "==> Listen em ports.conf"
grep -E 'Listen|IfModule|ssl_module' /etc/apache2/ports.conf 2>/dev/null || true
LISTEN443_COUNT="$(grep -cE 'Listen 443' /etc/apache2/ports.conf 2>/dev/null || echo 0)"
if [ "$LISTEN443_COUNT" -gt 1 ]; then
  echo "   ERRO — Listen 443 duplicado ($LISTEN443_COUNT vezes). Rode: bash deploy/fix-apache-ssl.sh"
fi
echo

if [ -n "$DOMAIN" ]; then
  echo "==> Certificado Let's Encrypt"
  if ssl_cert_exists "$DOMAIN"; then
    echo "   OK — /etc/letsencrypt/live/${DOMAIN}/"
    openssl x509 -in "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" -noout -dates 2>/dev/null || true
  else
    echo "   ERRO — certificado não encontrado para ${DOMAIN}"
    echo "   Rode: bash deploy/setup-ssl.sh"
  fi
  echo

  echo "==> Teste HTTP (porta 80)"
  TEST_HOST="${DOMAIN:-$HOST}"
  if [ -n "$TEST_HOST" ]; then
    curl -sI --max-time 8 "http://${TEST_HOST}/" | head -5 || echo "   Falhou"
  else
    echo "   Pulado — nenhum host configurado"
  fi
  echo

  if [ -n "$DOMAIN" ]; then
  echo "==> Teste HTTPS (porta 443)"
  if curl -sI --max-time 8 "https://${DOMAIN}/" | head -5; then
    echo "   OK"
  else
    echo "   ERRO — HTTPS não responde (SSL_ERROR_RX_RECORD_TOO_LONG = HTTP na porta 443)"
    echo "   Resposta bruta na 443:"
    curl -s --max-time 5 "http://${DOMAIN}:443/" | head -3 || true
  fi
  fi
fi

echo
echo "==> Configuração do Apache"
apache2ctl configtest 2>&1 || true
