#!/usr/bin/env bash
# Backup diário: banco (pg_dump) + fotos (uploads) → Google Drive via rclone.
# Mantém apenas os últimos BACKUP_KEEP dias (padrão 3) no Drive.

BACKUP_UNIT="paroquia-backup"

backup_config() {
  BACKUP_REMOTE="$(read_env_value BACKUP_REMOTE "$ENV_FILE" 2>/dev/null || echo gdrive)"
  BACKUP_FOLDER="$(read_env_value BACKUP_FOLDER "$ENV_FILE" 2>/dev/null || echo backups-paroquia)"
  BACKUP_KEEP="$(read_env_value BACKUP_KEEP "$ENV_FILE" 2>/dev/null || echo 3)"
  BACKUP_TIME="$(read_env_value BACKUP_TIME "$ENV_FILE" 2>/dev/null || echo 03:00)"

  local upload_dir
  upload_dir="$(read_env_value UPLOAD_DIR "$ENV_FILE" 2>/dev/null || echo uploads)"
  if [[ "$upload_dir" = /* ]]; then
    BACKUP_UPLOADS_DIR="$upload_dir"
  else
    BACKUP_UPLOADS_DIR="$APP_DIR/apps/api/$upload_dir"
  fi
}

backup_remote_ready() {
  command -v rclone >/dev/null 2>&1 \
    && rclone listremotes 2>/dev/null | grep -qx "${BACKUP_REMOTE}:"
}

backup_install_rclone() {
  if command -v rclone >/dev/null 2>&1; then
    return 0
  fi
  deploy_log "Instalando rclone..."
  apt-get install -y unzip >/dev/null 2>&1 || true
  curl -fsSL https://rclone.org/install.sh | bash
}

backup_setup_drive() {
  backup_config
  backup_install_rclone

  if backup_remote_ready; then
    deploy_log "Remote '${BACKUP_REMOTE}' já configurado"
  else
    cat <<EOF

══════════════════════════════════════════════════════════════
 Conectar ao Google Drive
══════════════════════════════════════════════════════════════
 O servidor não tem navegador, então a autorização é feita no
 seu PC:

 1. No PC (PowerShell), instale o rclone:
      winget install Rclone.Rclone
 2. Abaixo vai aparecer um comando "rclone authorize ...".
    Copie e rode no PC. O navegador abre — entre com a conta
    Google onde ficarão os backups e autorize.
 3. O PC imprime um token (texto entre chaves {...}).
    Cole aqui em "config_token>".
══════════════════════════════════════════════════════════════

EOF
    # scope=drive.file: o rclone só enxerga os arquivos que ele mesmo criou.
    rclone config create "$BACKUP_REMOTE" drive scope=drive.file config_is_local=false
  fi

  backup_remote_ready || deploy_die "Remote '${BACKUP_REMOTE}' não foi criado"

  backup_install_timer
  deploy_log "Fazendo o primeiro backup agora..."
  backup_run
}

backup_install_timer() {
  backup_config
  command -v systemctl >/dev/null 2>&1 || { deploy_warn "systemd ausente — timer de backup não instalado"; return 0; }

  cat > "/etc/systemd/system/${BACKUP_UNIT}.service" <<EOF
[Unit]
Description=Backup diario da paroquia (banco + fotos) para o Google Drive
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=APP_DIR=${APP_DIR}
ExecStart=/usr/bin/env bash ${APP_DIR}/deploy/backup.sh run
Nice=10
IOSchedulingClass=idle
EOF

  cat > "/etc/systemd/system/${BACKUP_UNIT}.timer" <<EOF
[Unit]
Description=Agenda o backup diario da paroquia

[Timer]
OnCalendar=*-*-* ${BACKUP_TIME}:00 America/Sao_Paulo
Persistent=true
RandomizedDelaySec=10min

[Install]
WantedBy=timers.target
EOF

  systemctl daemon-reload
  systemctl enable --now "${BACKUP_UNIT}.timer" >/dev/null 2>&1 \
    || { deploy_warn "Não foi possível ativar ${BACKUP_UNIT}.timer"; return 0; }
  deploy_log "Backup diário agendado (${BACKUP_TIME}, horário de Brasília)"
}

backup_run() {
  backup_config

  if ! backup_remote_ready; then
    deploy_die "Google Drive não configurado — rode: bash deploy/backup.sh setup"
  fi

  # Evita dois backups ao mesmo tempo.
  exec 9>"/tmp/${BACKUP_UNIT}.lock"
  flock -n 9 || deploy_die "Outro backup já está em andamento"

  local day work dest
  day="$(TZ=America/Sao_Paulo date +%F)"
  work="$(mktemp -d "/tmp/${BACKUP_UNIT}.XXXXXX")"
  dest="${BACKUP_REMOTE}:${BACKUP_FOLDER}/${day}"
  # shellcheck disable=SC2064
  trap "rm -rf '$work'" EXIT

  deploy_log "Backup ${day} → ${dest}"

  deploy_log "Exportando banco..."
  compose exec -T postgres sh -c \
    'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges --clean --if-exists' \
    | gzip -9 > "$work/banco.sql.gz"
  gzip -t "$work/banco.sql.gz" || deploy_die "Dump do banco corrompido"
  [ "$(zcat "$work/banco.sql.gz" | head -c 1024 | wc -c)" -gt 0 ] || deploy_die "Dump do banco vazio"

  if [ -d "$BACKUP_UPLOADS_DIR" ]; then
    deploy_log "Empacotando fotos ($BACKUP_UPLOADS_DIR)..."
    # Fotos já são comprimidas — tar sem gzip economiza CPU.
    tar -cf "$work/fotos.tar" -C "$(dirname "$BACKUP_UPLOADS_DIR")" "$(basename "$BACKUP_UPLOADS_DIR")"
  else
    deploy_warn "Pasta de fotos não encontrada: $BACKUP_UPLOADS_DIR"
  fi

  du -sh "$work"/* | sed 's/^/   /'

  deploy_log "Enviando para o Google Drive..."
  rclone copy "$work" "$dest" --transfers 2 --retries 5 --low-level-retries 20 --stats-one-line --stats 1m

  backup_prune
  deploy_log "Backup concluído"
}

backup_prune() {
  local dirs total excess dir
  # Pastas no formato AAAA-MM-DD, da mais antiga para a mais nova.
  dirs="$(rclone lsf --dirs-only "${BACKUP_REMOTE}:${BACKUP_FOLDER}" 2>/dev/null \
    | sed 's|/$||' | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' | sort || true)"
  [ -n "$dirs" ] || return 0

  total="$(printf '%s\n' "$dirs" | wc -l)"
  excess=$(( total - BACKUP_KEEP ))
  [ "$excess" -gt 0 ] || return 0

  printf '%s\n' "$dirs" | head -n "$excess" | while read -r dir; do
    deploy_log "Removendo backup antigo: $dir"
    # Apaga de vez (sem lixeira) para não ocupar espaço do Drive.
    rclone purge "${BACKUP_REMOTE}:${BACKUP_FOLDER}/${dir}" --drive-use-trash=false
  done
}

backup_list() {
  backup_config
  backup_remote_ready || deploy_die "Google Drive não configurado — rode: bash deploy/backup.sh setup"
  rclone lsl "${BACKUP_REMOTE}:${BACKUP_FOLDER}"
}

backup_restore() {
  local day="${1:?Informe a data: bash deploy/backup.sh restore AAAA-MM-DD}"
  backup_config
  backup_remote_ready || deploy_die "Google Drive não configurado"

  local work src
  work="$(mktemp -d "/tmp/${BACKUP_UNIT}-restore.XXXXXX")"
  src="${BACKUP_REMOTE}:${BACKUP_FOLDER}/${day}"

  deploy_log "Baixando ${src}..."
  rclone copy "$src" "$work"
  [ -f "$work/banco.sql.gz" ] || deploy_die "banco.sql.gz não encontrado em ${src}"

  cat <<EOF

ATENÇÃO: isto vai SUBSTITUIR o banco e as fotos atuais pelo backup de ${day}.
Digite RESTAURAR para continuar:
EOF
  local answer
  read -r answer
  [ "$answer" = "RESTAURAR" ] || { rm -rf "$work"; deploy_die "Cancelado"; }

  deploy_log "Restaurando banco..."
  zcat "$work/banco.sql.gz" | compose exec -T postgres sh -c \
    'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

  if [ -f "$work/fotos.tar" ]; then
    deploy_log "Restaurando fotos..."
    if [ -d "$BACKUP_UPLOADS_DIR" ]; then
      mv "$BACKUP_UPLOADS_DIR" "${BACKUP_UPLOADS_DIR}.antes-restore-$(date +%s)"
    fi
    tar -xf "$work/fotos.tar" -C "$(dirname "$BACKUP_UPLOADS_DIR")"
  fi

  rm -rf "$work"
  pm2 restart paroquia-api >/dev/null 2>&1 || true
  deploy_log "Restauração concluída"
}
