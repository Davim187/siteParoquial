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

  while grep -qE '^Listen 443$' "$ports" 2>/dev/null \
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

  local app_block proxy_http proxy_https logs perf_block uploads_block upload_dir

  # /uploads servido direto pelo Apache (mais rápido que passar pelo Node).
  # Se o www-data não conseguir ler a pasta, mantém o proxy para a API.
  upload_dir="$(resolve_upload_dir "$app_dir")"
  if apache_can_read_dir "$upload_dir"; then
    uploads_block="$(cat <<UPLOADS
    Alias /uploads ${upload_dir}
    <Directory ${upload_dir}>
        Options -Indexes -ExecCGI
        AllowOverride None
        Require all granted
        Header set Cache-Control "public, max-age=31536000, immutable"
        Header set X-Content-Type-Options "nosniff"
    </Directory>
UPLOADS
)"
  else
    uploads_block="$(cat <<'UPLOADS'
    ProxyPass /uploads http://127.0.0.1:3333/uploads connectiontimeout=30 timeout=600
    ProxyPassReverse /uploads http://127.0.0.1:3333/uploads
    <Location /uploads>
        Header set Cache-Control "public, max-age=31536000, immutable"
    </Location>
UPLOADS
)"
  fi

  perf_block="$(cat <<'PERF'
    <IfModule http2_module>
        Protocols h2 http/1.1
    </IfModule>
    <IfModule deflate_module>
        AddOutputFilterByType DEFLATE text/html text/css text/plain text/javascript application/javascript application/json image/svg+xml
    </IfModule>
    <LocationMatch "^/assets/">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>
PERF
)"

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
        <Files "index.html">
            Header set Cache-Control "no-cache"
        </Files>
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
${perf_block}
${app_block}
${uploads_block}
${proxy_https}
${logs}
</VirtualHost>
EOF
  else
    cat > "$APACHE_OUTPUT" <<EOF
<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
${perf_block}
${app_block}
${uploads_block}
${proxy_http}
${logs}
</VirtualHost>
EOF
  fi
}

ensure_apache_modules() {
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -y apache2 >/dev/null 2>&1 || apt-get install -y apache2
  a2enmod proxy proxy_http rewrite headers ssl deflate >/dev/null 2>&1 || true
  # HTTP/2 só é usado com mpm_event/worker; com prefork o Apache ignora o h2.
  a2enmod http2 >/dev/null 2>&1 || true
}

# Mesma regra do server.ts: UPLOAD_DIR relativo ao cwd da API (apps/api).
resolve_upload_dir() {
  local app_dir="$1" upload_dir
  upload_dir="$(read_env_value UPLOAD_DIR "$ENV_FILE" 2>/dev/null || true)"
  upload_dir="${upload_dir:-uploads}"
  case "$upload_dir" in
    /*) printf '%s\n' "$upload_dir" ;;
    *) printf '%s\n' "${app_dir}/apps/api/${upload_dir}" ;;
  esac
}

apache_can_read_dir() {
  local dir="$1"
  [ -d "$dir" ] || return 1
  id www-data >/dev/null 2>&1 || return 1
  command -v runuser >/dev/null 2>&1 || return 1
  runuser -u www-data -- test -r "$dir" -a -x "$dir"
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

  disable_conflicting_sites "$domain"

  systemctl enable apache2 >/dev/null 2>&1 || true
  if ensure_event_mpm; then
    apache2ctl configtest
    systemctl restart apache2
  else
    reload_apache
  fi
  log_apache_diagnostics "$domain"
}

# Outros sites ativos com o mesmo domínio (ex.: *-le-ssl.conf criado pelo
# certbot) podem carregar antes do nosso e responder no lugar dele.
disable_conflicting_sites() {
  local domain="$1" site name
  for site in /etc/apache2/sites-enabled/*.conf; do
    [ -e "$site" ] || continue
    name="$(basename "$site")"
    [ "$name" = "$APACHE_SITE" ] && continue
    if grep -qiE "^[[:space:]]*Server(Name|Alias)[[:space:]].*(^|[[:space:].])${domain//./\\.}([[:space:]]|$)" "$site"; then
      deploy_warn "Desativando site duplicado para ${domain}: ${name} (arquivo mantido em sites-available)"
      a2dissite "$name" >/dev/null 2>&1 || true
    fi
  done
}

# HTTP/2 não funciona com mpm_prefork. Troca para mpm_event, exceto se houver
# PHP carregado como módulo (que exige prefork). Retorna 0 se trocou.
ensure_event_mpm() {
  local mods
  mods="$(apache2ctl -M 2>/dev/null || true)"
  grep -q "mpm_prefork_module" <<<"$mods" || return 1
  if grep -qE "php[0-9._]*_module" <<<"$mods"; then
    deploy_warn "Apache em mpm_prefork com PHP; HTTP/2 continuará desativado"
    return 1
  fi
  deploy_log "Trocando Apache de mpm_prefork para mpm_event (necessário para HTTP/2)"
  a2dismod -q mpm_prefork >/dev/null 2>&1 || true
  a2enmod -q mpm_event >/dev/null 2>&1 || true
  return 0
}

log_apache_diagnostics() {
  local domain="$1" upload_dir
  upload_dir="$(resolve_upload_dir "$APP_DIR")"
  deploy_log "Apache: módulos $(apache2ctl -M 2>/dev/null | grep -oE 'mpm_[a-z]+|http2|deflate' | sort -u | tr '\n' ' ')"
  deploy_log "Apache: sites ativos $(ls /etc/apache2/sites-enabled 2>/dev/null | tr '\n' ' ')"
  if apache_can_read_dir "$upload_dir"; then
    deploy_log "Apache: /uploads servido direto de ${upload_dir}"
  else
    deploy_warn "Apache: /uploads via proxy da API (www-data não lê ${upload_dir})"
  fi
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
