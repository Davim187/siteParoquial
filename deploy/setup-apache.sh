#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_DIR="${APP_DIR:-$(resolve_app_dir)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
APACHE_SITE="paroquia.conf"

echo "==> Instalando Apache..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y apache2

echo "==> Habilitando módulos..."
a2enmod proxy proxy_http rewrite headers

echo "==> Configurando site..."
sed "s|__APP_DIR__|${APP_DIR}|g" "$SCRIPT_DIR/apache/paroquia.conf" \
  > "/etc/apache2/sites-available/${APACHE_SITE}"

if [ -f "$ENV_FILE" ]; then
  domain="$(read_env_value PUBLIC_URL "$ENV_FILE" 2>/dev/null | sed -E 's|^https?://||' | sed 's|/.*||' || true)"
  if [ -n "$domain" ]; then
    sed -i "s|^    ServerName .*|    ServerName ${domain}|" "/etc/apache2/sites-available/${APACHE_SITE}"
    sed -i "s|^    ServerAlias .*|    ServerAlias www.${domain}|" "/etc/apache2/sites-available/${APACHE_SITE}"
  fi
fi

a2ensite "$APACHE_SITE"
a2dissite 000-default.conf 2>/dev/null || true

echo "==> Reiniciando Apache..."
systemctl enable apache2
systemctl reload apache2

echo "==> Apache configurado."
echo "   Site: /etc/apache2/sites-available/${APACHE_SITE}"
echo "   DocumentRoot: ${APP_DIR}/apps/web/dist"
