#!/usr/bin/env bash

APACHE_SITE="paroquia.conf"
APACHE_OUTPUT="/etc/apache2/sites-available/${APACHE_SITE}"

ssl_cert_exists() {
  local domain="$1"
  [ -f "/etc/letsencrypt/live/${domain}/fullchain.pem" ] \
    && [ -f "/etc/letsencrypt/live/${domain}/privkey.pem" ]
}

disable_default_apache_sites() {
  a2dissite 000-default.conf 000-default 2>/dev/null || true
  a2dissite default-ssl.conf default-ssl 2>/dev/null || true
}

fix_apache_ports() {
  local enabled="$1"
  local ports="/etc/apache2/ports.conf"

  [ -f "$ports" ] || return 0

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

reload_apache() {
  apache2ctl configtest
  systemctl reload apache2
}

write_apache_config() {
  local app_dir="$1"
  local domain="$2"
  local ssl_enabled="${3:-0}"

  local app_block proxy_http proxy_https logs

  app_block="$(cat <<EOF
    DocumentRoot ${app_dir}/apps/web/dist
    Timeout 600
    ProxyTimeout 600
    LimitRequestBody 0
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

  proxy_http="$(cat <<'EOF'
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    <Location /api>
        LimitRequestBody 0
    </Location>
    ProxyPass /api http://127.0.0.1:3333/api connectiontimeout=30 timeout=600
    ProxyPassReverse /api http://127.0.0.1:3333/api
    ProxyPass /uploads http://127.0.0.1:3333/uploads connectiontimeout=30 timeout=600
    ProxyPassReverse /uploads http://127.0.0.1:3333/uploads
EOF
)"

  proxy_https="$(cat <<'EOF'
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
    <Location /api>
        LimitRequestBody 0
    </Location>
    ProxyPass /api http://127.0.0.1:3333/api connectiontimeout=30 timeout=600
    ProxyPassReverse /api http://127.0.0.1:3333/api
    ProxyPass /uploads http://127.0.0.1:3333/uploads connectiontimeout=30 timeout=600
    ProxyPassReverse /uploads http://127.0.0.1:3333/uploads
EOF
)"

  logs="$(cat <<'EOF'
    ErrorLog ${APACHE_LOG_DIR}/paroquia-error.log
    CustomLog ${APACHE_LOG_DIR}/paroquia-access.log combined
EOF
)"

  if [ "$ssl_enabled" = "1" ]; then
    cat > "$APACHE_OUTPUT" <<EOF
<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/\\.well-known/acme-challenge/
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
${logs}
</VirtualHost>

<VirtualHost *:443>
    ServerName ${domain}
    ServerAlias www.${domain}
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${domain}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${domain}/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
${app_block}
${proxy_https}
${logs}
</VirtualHost>
EOF
  else
    cat > "$APACHE_OUTPUT" <<EOF
<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
${app_block}
${proxy_http}
${logs}
</VirtualHost>
EOF
  fi
}

ensure_apache_modules() {
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -y apache2 >/dev/null 2>&1 || apt-get install -y apache2
  a2enmod proxy proxy_http rewrite headers ssl >/dev/null 2>&1 || true
}

resolve_site_domain() {
  domain_from_env "$ENV_FILE" 2>/dev/null \
    || host_from_env "$ENV_FILE" 2>/dev/null \
    || printf '%s\n' "paroquiansdasgracas.com.br"
}

configure_apache() {
  local domain ssl_enabled=0

  domain="$(resolve_site_domain)"
  ensure_apache_modules
  disable_default_apache_sites

  if ssl_cert_exists "$domain"; then
    ssl_enabled=1
    deploy_log "Apache + HTTPS ($domain)"
  else
    deploy_log "Apache HTTP ($domain) — certificado ainda não emitido"
    fix_apache_ports 0
  fi

  cat > /etc/apache2/conf-available/paroquia-upload.conf <<'EOF'
LimitRequestBody 0
EOF
  a2enconf paroquia-upload >/dev/null 2>&1 || true

  write_apache_config "$APP_DIR" "$domain" "$ssl_enabled"
  a2ensite "$APACHE_SITE" >/dev/null 2>&1 || true
  a2dissite 000-default.conf >/dev/null 2>&1 || true

  if [ "$ssl_enabled" = "1" ]; then
    fix_apache_ports 1
  fi

  systemctl enable apache2 >/dev/null 2>&1 || true
  reload_apache
}

configure_ssl() {
  local domain acme_email

  domain="$(domain_from_env "$ENV_FILE" 2>/dev/null || true)"
  acme_email="$(read_env_value ACME_EMAIL "$ENV_FILE" 2>/dev/null || true)"

  [ -n "$domain" ] || deploy_die "PUBLIC_URL/CORS_ORIGIN devem usar domínio (não IP)"
  [[ "$domain" =~ ^[0-9.]+$ ]] && deploy_die "Domínio não pode ser IP: $domain"
  [ -n "$acme_email" ] || deploy_die "ACME_EMAIL ausente em $ENV_FILE"
  [ -d "$APP_DIR/apps/web/dist" ] || deploy_die "Build do frontend ausente — rode deploy completo antes"

  deploy_log "Configurando SSL ($domain)..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y certbot python3-certbot-apache

  ensure_apache_modules
  disable_default_apache_sites
  fix_apache_ports 0
  write_apache_config "$APP_DIR" "$domain" 0
  a2ensite "$APACHE_SITE" >/dev/null 2>&1 || true
  reload_apache

  if ssl_cert_exists "$domain"; then
    deploy_log "Certificado existente — renovando se necessário..."
    certbot renew --quiet --no-random-sleep-on-renew || true
  else
    deploy_log "Obtendo certificado Let's Encrypt..."
    certbot certonly --webroot \
      -w "$APP_DIR/apps/web/dist" \
      -d "$domain" -d "www.$domain" \
      --non-interactive --agree-tos -m "$acme_email" \
      --cert-name "$domain"
  fi

  ssl_cert_exists "$domain" || deploy_die "Certificado SSL não encontrado após certbot"

  if [ ! -f /etc/letsencrypt/options-ssl-apache.conf ]; then
    mkdir -p /etc/letsencrypt
    cat > /etc/letsencrypt/options-ssl-apache.conf <<'EOF'
SSLEngine on
SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
SSLHonorCipherOrder off
SSLSessionTickets off
EOF
  fi

  write_apache_config "$APP_DIR" "$domain" 1
  fix_apache_ports 1
  reload_apache

  mkdir -p /etc/letsencrypt/renewal-hooks/deploy
  cat > /etc/letsencrypt/renewal-hooks/deploy/paroquia-reload-apache.sh <<'EOF'
#!/usr/bin/env bash
systemctl reload apache2
EOF
  chmod +x /etc/letsencrypt/renewal-hooks/deploy/paroquia-reload-apache.sh

  deploy_log "HTTPS ativo — https://${domain}"
}
