#!/usr/bin/env bash
# Backup do banco + fotos para o Google Drive (mantém os últimos 3 dias).
#
# Uso (no VPS, como root):
#   bash deploy/backup.sh setup              # 1ª vez: conecta o Google Drive, agenda e faz um backup
#   bash deploy/backup.sh run                # backup agora (é o que o timer diário executa)
#   bash deploy/backup.sh list               # lista os backups no Drive
#   bash deploy/backup.sh restore AAAA-MM-DD # restaura banco + fotos de um dia
#   bash deploy/backup.sh status             # próxima execução e último log

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT_DIR="$SCRIPT_DIR"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

deploy_init

case "${1:-run}" in
  setup)    backup_setup_drive ;;
  run)      backup_run ;;
  list)     backup_list ;;
  restore)  backup_restore "${2:-}" ;;
  install)  backup_install_timer ;;
  status)
    systemctl list-timers "${BACKUP_UNIT}.timer" --no-pager || true
    echo
    journalctl -u "${BACKUP_UNIT}.service" -n 30 --no-pager || true
    ;;
  -h|--help|help)
    sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
    ;;
  *)
    deploy_die "Comando desconhecido: $1 (use --help)"
    ;;
esac
