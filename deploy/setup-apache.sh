#!/usr/bin/env bash
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

echo "==> Instalando Apache..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y apache2

echo "==> Habilitando módulos..."
a2enmod proxy proxy_http rewrite headers ssl

disable_default_apache_sites

DOMAIN="$(domain_from_env "$ENV_FILE" 2>/dev/null || host_from_env "$ENV_FILE" 2>/dev/null || true)"
if [ -z "$DOMAIN" ]; then
  DOMAIN="paroquiansdasgracas.com.br"
fi

SSL_ENABLED=0
if ssl_cert_exists "$DOMAIN"; then
  SSL_ENABLED=1
  echo "==> Certificado SSL encontrado para $DOMAIN"
else
  echo "==> Sem certificado SSL — site em HTTP até rodar deploy/setup-ssl.sh"
  set_apache_listen_443 0
fi

echo "==> Configurando site..."
write_apache_site_config "$APP_DIR" "$DOMAIN" "$OUTPUT" "$SSL_ENABLED"

a2ensite "$APACHE_SITE"

if [ "$SSL_ENABLED" = "1" ]; then
  set_apache_listen_443 1
fi

echo "==> Reiniciando Apache..."
systemctl enable apache2
reload_apache_safe

if [ "$SSL_ENABLED" = "1" ]; then
  echo "==> Apache configurado com HTTPS."
  echo "   https://${DOMAIN}"
else
  echo "==> Apache configurado (HTTP)."
  echo "   http://${DOMAIN}"
  echo "   Porta 443 desativada até o certificado ser emitido."
fi

echo "   Site: $OUTPUT"
echo "   DocumentRoot: ${APP_DIR}/apps/web/dist"
