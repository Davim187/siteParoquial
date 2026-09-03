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

DOMAIN="$(domain_from_env "$ENV_FILE" 2>/dev/null || true)"
ACME_EMAIL="$(read_env_value ACME_EMAIL "$ENV_FILE" 2>/dev/null || true)"
PUBLIC_URL_VAL="$(read_env_value PUBLIC_URL "$ENV_FILE" 2>/dev/null || true)"

if [ -z "$DOMAIN" ]; then
  echo "ERRO: PUBLIC_URL/CORS_ORIGIN estão com IP ou vazios."
  echo ""
  echo "Valor atual de PUBLIC_URL: ${PUBLIC_URL_VAL:-(vazio)}"
  echo ""
  echo "Let's Encrypt não emite certificado para IP. Edite $ENV_FILE:"
  echo "  PUBLIC_URL=https://paroquiansdasgracas.com.br"
  echo "  CORS_ORIGIN=https://paroquiansdasgracas.com.br"
  echo ""
  echo "Depois rode novamente: bash deploy/setup-ssl.sh"
  exit 1
fi

if [[ "$DOMAIN" =~ ^[0-9.]+$ ]]; then
  echo "ERRO: domínio resolvido como IP ($DOMAIN). Use o nome do domínio no .env.production."
  exit 1
fi

if [ -z "$ACME_EMAIL" ]; then
  echo "ACME_EMAIL não definido em $ENV_FILE."
  exit 1
fi

if [ ! -d "$APP_DIR/apps/web/dist" ]; then
  echo "ERRO: build do frontend não encontrado em $APP_DIR/apps/web/dist"
  echo "Rode antes: npm ci && npm run build"
  exit 1
fi

echo "==> Domínio: $DOMAIN"
echo "==> E-mail Let's Encrypt: $ACME_EMAIL"

echo "==> Removendo sites padrão do Apache (evita HTTP na porta 443)..."
disable_default_apache_sites
set_apache_listen_443 0

echo "==> Garantindo Apache em HTTP (porta 80) para validação..."
write_apache_site_config "$APP_DIR" "$DOMAIN" "$OUTPUT" 0
a2enmod ssl headers proxy proxy_http rewrite 2>/dev/null || true
a2ensite "$APACHE_SITE" 2>/dev/null || true
reload_apache_safe

if ssl_cert_exists "$DOMAIN"; then
  echo "==> Certificado já existe. Renovando se necessário..."
  certbot renew --quiet --no-random-sleep-on-renew || true
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
  echo "Verifique DNS, porta 80 aberta e logs: journalctl -u apache2 -n 50"
  exit 1
fi

if [ ! -f /etc/letsencrypt/options-ssl-apache.conf ]; then
  echo "==> Criando options-ssl-apache.conf..."
  mkdir -p /etc/letsencrypt
  cat > /etc/letsencrypt/options-ssl-apache.conf <<'EOF'
SSLEngine on
SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
SSLHonorCipherOrder off
SSLSessionTickets off
EOF
fi

echo "==> Ativando HTTPS no Apache..."
write_apache_site_config "$APP_DIR" "$DOMAIN" "$OUTPUT" 1
set_apache_listen_443 1
reload_apache_safe

HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
mkdir -p "$HOOK_DIR"
cat > "$HOOK_DIR/paroquia-reload-apache.sh" <<'EOF'
#!/usr/bin/env bash
systemctl reload apache2
EOF
chmod +x "$HOOK_DIR/paroquia-reload-apache.sh"

echo "==> Testando HTTPS localmente..."
if curl -fsSI "https://${DOMAIN}/" >/dev/null 2>&1; then
  echo "   OK — HTTPS respondendo"
else
  echo "   AVISO — HTTPS ainda não respondeu. Aguarde DNS/propagação ou verifique: bash deploy/check-ssl.sh"
fi

echo "==> Testando renovação automática..."
certbot renew --dry-run || echo "   AVISO: teste de renovação falhou — verifique depois com certbot renew --dry-run"

echo "==> HTTPS configurado."
echo "   https://${DOMAIN}"
