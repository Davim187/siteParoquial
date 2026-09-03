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

echo "==> Instalando Certbot..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y certbot python3-certbot-apache

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: $ENV_FILE não encontrado."
  exit 1
fi

DOMAIN="$(domain_from_env "$ENV_FILE" || true)"
ACME_EMAIL="$(read_env_value ACME_EMAIL "$ENV_FILE" 2>/dev/null || true)"

if [ -z "$DOMAIN" ]; then
  echo "PUBLIC_URL ou CORS_ORIGIN não definido em $ENV_FILE — HTTPS ignorado."
  exit 0
fi

if [[ "$DOMAIN" =~ ^[0-9.]+$ ]]; then
  echo "Domínio é um IP ($DOMAIN). HTTPS com Let's Encrypt exige um domínio válido."
  exit 0
fi

if [ -z "$ACME_EMAIL" ]; then
  echo "ACME_EMAIL não definido em $ENV_FILE."
  exit 1
fi

echo "==> Domínio: $DOMAIN"
echo "==> E-mail Let's Encrypt: $ACME_EMAIL"

echo "==> Garantindo Apache em HTTP (para validação do certificado)..."
write_apache_site_config "$APP_DIR" "$DOMAIN" "$OUTPUT" 0
a2enmod ssl headers proxy proxy_http rewrite 2>/dev/null || true
a2ensite "$APACHE_SITE" 2>/dev/null || true
a2dissite 000-default.conf 2>/dev/null || true
systemctl reload apache2

if ssl_cert_exists "$DOMAIN"; then
  echo "==> Certificado já existe. Renovando se necessário..."
  certbot renew --quiet --no-random-sleep-on-renew
else
  echo "==> Obtendo certificado SSL..."
  certbot certonly --webroot \
    -w "$APP_DIR/apps/web/dist" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$ACME_EMAIL" \
    --cert-name "$DOMAIN"
fi

if ! ssl_cert_exists "$DOMAIN"; then
  echo "ERRO: certificado não encontrado após certbot."
  exit 1
fi

echo "==> Ativando HTTPS no Apache..."
write_apache_site_config "$APP_DIR" "$DOMAIN" "$OUTPUT" 1
systemctl reload apache2

HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
mkdir -p "$HOOK_DIR"
cat > "$HOOK_DIR/paroquia-reload-apache.sh" <<EOF
#!/usr/bin/env bash
systemctl reload apache2
EOF
chmod +x "$HOOK_DIR/paroquia-reload-apache.sh"

echo "==> Testando renovação automática..."
certbot renew --dry-run

echo "==> HTTPS configurado."
echo "   https://${DOMAIN}"
