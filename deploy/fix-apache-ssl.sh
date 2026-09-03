#!/usr/bin/env bash
# Corrige ports.conf duplicado e reaplica HTTPS no Apache.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"
# shellcheck source=apache/render-config.sh
source "$SCRIPT_DIR/apache/render-config.sh"

APP_DIR="${APP_DIR:-$(resolve_app_dir)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
APACHE_SITE="paroquia.conf"
OUTPUT="/etc/apache2/sites-available/${APACHE_SITE}"

DOMAIN="$(domain_from_env "$ENV_FILE")"

echo "==> Corrigindo ports.conf (Listen 443 duplicado)..."
set_apache_listen_443 1

echo "==> Sites padrão desabilitados..."
disable_default_apache_sites

if ! ssl_cert_exists "$DOMAIN"; then
  echo "ERRO: certificado não encontrado para $DOMAIN"
  echo "Rode: bash deploy/setup-ssl.sh"
  exit 1
fi

echo "==> Reaplicando virtual host HTTPS..."
write_apache_site_config "$APP_DIR" "$DOMAIN" "$OUTPUT" 1
a2enmod ssl headers proxy proxy_http rewrite 2>/dev/null || true
a2ensite "$APACHE_SITE" 2>/dev/null || true

echo "==> Recarregando Apache..."
reload_apache_safe

echo "==> Teste HTTPS..."
if curl -fsSI "https://${DOMAIN}/" >/dev/null 2>&1; then
  echo "   OK — https://${DOMAIN}"
else
  echo "   AVISO — ainda falhou. Rode: bash deploy/check-ssl.sh"
  exit 1
fi
