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

echo "==> Diagnóstico SSL — $DOMAIN"
echo

echo "==> Portas em uso"
ss -tlnp | grep -E ':80 |:443 ' || echo "   Nenhuma porta 80/443 encontrada"
echo

echo "==> Sites Apache habilitados"
a2query -s 2>/dev/null || ls -la /etc/apache2/sites-enabled/
echo

echo "==> Listen em ports.conf"
grep -E '^Listen|^# Listen' /etc/apache2/ports.conf 2>/dev/null || true
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
  curl -sI --max-time 8 "http://${DOMAIN}/" | head -5 || echo "   Falhou"
  echo

  echo "==> Teste HTTPS (porta 443)"
  if curl -sI --max-time 8 "https://${DOMAIN}/" | head -5; then
    echo "   OK"
  else
    echo "   ERRO — HTTPS não responde (SSL_ERROR_RX_RECORD_TOO_LONG = HTTP na porta 443)"
    echo "   Resposta bruta na 443:"
    curl -s --max-time 5 "http://${DOMAIN}:443/" | head -3 || true
  fi
fi

echo
echo "==> Configuração do Apache"
apache2ctl configtest 2>&1 || true
