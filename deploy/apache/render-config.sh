#!/usr/bin/env bash

domain_from_env() {
  local file="$1"
  local url

  url="$(read_env_value PUBLIC_URL "$file" 2>/dev/null || read_env_value CORS_ORIGIN "$file" 2>/dev/null || true)"
  url="${url#\"}"
  url="${url%\"}"
  url="${url#\'}"
  url="${url%\'}"

  if [ -z "$url" ]; then
    return 1
  fi

  printf '%s\n' "$url" | sed -E 's|^https?://||' | sed 's|/.*||'
}

ssl_cert_exists() {
  local domain="$1"
  [ -f "/etc/letsencrypt/live/${domain}/fullchain.pem" ] \
    && [ -f "/etc/letsencrypt/live/${domain}/privkey.pem" ]
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
