#!/usr/bin/env bash

host_from_url() {
  printf '%s\n' "$1" | sed -E 's|^https?://||' | sed 's|/.*||' | sed 's|:.*||'
}

is_ip_address() {
  [[ "$1" =~ ^[0-9]+(\.[0-9]+){3}$ ]]
}

# Prefer domínio (não IP). Let's Encrypt não emite certificado para IP comum.
domain_from_env() {
  local file="$1"
  local key url host

  if host="$(read_env_value SITE_DOMAIN "$file" 2>/dev/null || true)" && [ -n "$host" ]; then
    host="$(host_from_url "$host")"
    if ! is_ip_address "$host"; then
      printf '%s\n' "$host"
      return 0
    fi
  fi

  for key in PUBLIC_URL CORS_ORIGIN; do
    url="$(read_env_value "$key" "$file" 2>/dev/null || true)"
    [ -z "$url" ] && continue
    host="$(host_from_url "$url")"
    if ! is_ip_address "$host"; then
      printf '%s\n' "$host"
      return 0
    fi
  done

  return 1
}

# Qualquer host configurado (inclui IP) — útil para Apache em HTTP.
host_from_env() {
  local file="$1"
  local key url

  if host="$(read_env_value SITE_DOMAIN "$file" 2>/dev/null || true)" && [ -n "$host" ]; then
    host_from_url "$host"
    return 0
  fi

  for key in PUBLIC_URL CORS_ORIGIN; do
    url="$(read_env_value "$key" "$file" 2>/dev/null || true)"
    if [ -n "$url" ]; then
      host_from_url "$url"
      return 0
    fi
  done

  return 1
}

ssl_cert_exists() {
  local domain="$1"
  [ -f "/etc/letsencrypt/live/${domain}/fullchain.pem" ] \
    && [ -f "/etc/letsencrypt/live/${domain}/privkey.pem" ]
}

disable_default_apache_sites() {
  a2dissite 000-default.conf 000-default 2>/dev/null || true
  a2dissite default-ssl.conf default-ssl 2>/dev/null || true
}

set_apache_listen_443() {
  local enabled="$1"
  local ports="/etc/apache2/ports.conf"

  if [ ! -f "$ports" ]; then
    return
  fi

  # Ubuntu já define "Listen 443" dentro de <IfModule ssl_module>.
  # O script antigo adicionava outro "Listen 443" solto → erro AH00526.

  # Remove Listen 443 solto duplicado no fim do arquivo.
  while [ "$(grep -cE '^Listen 443$' "$ports" 2>/dev/null || echo 0)" -gt 0 ] \
    && grep -qE '[[:space:]]Listen 443' "$ports"; do
    sed -i '/^Listen 443$/d' "$ports"
  done

  sed -i '/^# Listen 443 disabled/d' "$ports"

  if [ "$enabled" = "1" ]; then
    sed -i 's/^\([[:space:]]*\)# Listen 443 disabled.*/\1Listen 443/' "$ports"
    sed -i 's/^\([[:space:]]*\)# Listen 443/\1Listen 443/' "$ports"

    if ! grep -qE 'Listen 443' "$ports"; then
      cat >> "$ports" <<'EOF'

<IfModule ssl_module>
	Listen 443
</IfModule>
EOF
    fi
  else
    sed -i '/^Listen 443$/d' "$ports"
    sed -i 's/^\([[:space:]]*\)Listen 443/\1# Listen 443 disabled/' "$ports"
  fi
}

reload_apache_safe() {
  apache2ctl configtest
  systemctl reload apache2
}

write_apache_site_config() {
  local app_dir="$1"
  local domain="$2"
  local output="$3"
  local ssl_enabled="${4:-0}"

  local app_block proxy_block logs_block

  app_block="$(cat <<EOF
    DocumentRoot ${app_dir}/apps/web/dist

    LimitRequestBody 12582912

    <Directory ${app_dir}/apps/web/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_URI} !^/\\.well-known/acme-challenge/
        RewriteRule ^index\\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
EOF
)"

  proxy_block_http="$(cat <<'EOF'
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"

    ProxyPass /api http://127.0.0.1:3333/api
    ProxyPassReverse /api http://127.0.0.1:3333/api
    ProxyPass /uploads http://127.0.0.1:3333/uploads
    ProxyPassReverse /uploads http://127.0.0.1:3333/uploads
EOF
)"

  proxy_block_https="$(cat <<'EOF'
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    ProxyPass /api http://127.0.0.1:3333/api
    ProxyPassReverse /api http://127.0.0.1:3333/api
    ProxyPass /uploads http://127.0.0.1:3333/uploads
    ProxyPassReverse /uploads http://127.0.0.1:3333/uploads
EOF
)"

  logs_block="$(cat <<'EOF'
    ErrorLog ${APACHE_LOG_DIR}/paroquia-error.log
    CustomLog ${APACHE_LOG_DIR}/paroquia-access.log combined
EOF
)"

  if [ "$ssl_enabled" = "1" ]; then
    cat > "$output" <<EOF
# Site paroquial — Apache + HTTPS (Certbot)

<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}

    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/\\.well-known/acme-challenge/
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

${logs_block}
</VirtualHost>

<VirtualHost *:443>
    ServerName ${domain}
    ServerAlias www.${domain}

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${domain}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${domain}/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf

    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

${app_block}

${proxy_block_https}

${logs_block}
</VirtualHost>
EOF
  else
    cat > "$output" <<EOF
# Site paroquial — Apache (HTTP; rode deploy/setup-ssl.sh para HTTPS)

<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}

${app_block}

${proxy_block_http}

${logs_block}
</VirtualHost>
EOF
  fi
}
