#!/usr/bin/env bash
# Deploy em produção — Apache (web) + PM2 (api) + Docker (Postgres)
#
# Uso:
#   bash deploy/deploy.sh          # deploy completo
#   bash deploy/deploy.sh api      # só API
#   bash deploy/deploy.sh web      # só frontend + Apache
#   bash deploy/deploy.sh ssl      # só HTTPS
#   bash deploy/setup.sh           # configuração inicial do VPS
#   bash deploy/doctor.sh          # diagnóstico

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT_DIR="$SCRIPT_DIR"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

CMD="${1:-deploy}"

deploy_full() {
  deploy_init
  validate_env_production "$ENV_FILE"

  deploy_log "Projeto: $APP_DIR"

  if [ "${SKIP_GIT:-0}" != "1" ]; then
    deploy_log "Atualizando código (${DEPLOY_BRANCH:-master})..."
    git_sync_branch "${DEPLOY_BRANCH:-master}"
  fi

  postgres_up
  npm_ci_dev
  build_all
  postgres_wait
  migrate_deploy
  restart_api
  wait_api_health
  configure_apache

  if domain_from_env "$ENV_FILE" >/dev/null 2>&1 \
    && read_env_value ACME_EMAIL "$ENV_FILE" >/dev/null 2>&1; then
    configure_ssl || deploy_warn "SSL não configurado — rode: bash deploy/deploy.sh ssl"
  fi

  deploy_log "Deploy concluído"
  pm2 status 2>/dev/null || true
}

deploy_api_only() {
  deploy_init
  validate_env_production "$ENV_FILE"
  postgres_up
  npm_ci_dev
  build_api
  postgres_wait
  migrate_deploy
  restart_api
  wait_api_health
  deploy_log "API atualizada"
}

deploy_web_only() {
  deploy_init
  validate_env_production "$ENV_FILE"
  npm_ci_dev
  build_web
  configure_apache
  deploy_log "Frontend atualizado"
}

deploy_ssl_only() {
  deploy_init
  validate_env_production "$ENV_FILE"
  configure_ssl
}

usage() {
  cat <<EOF
Uso: bash deploy/deploy.sh [comando]

Comandos:
  deploy, full   Deploy completo (padrão)
  api            Build + migrations + PM2
  web            Build frontend + Apache
  ssl            Certificado HTTPS (Certbot)
  setup          Configuração inicial do VPS
  doctor         Diagnóstico do ambiente

Exemplos:
  bash deploy/deploy.sh
  bash deploy/deploy.sh api
  bash deploy/doctor.sh
EOF
}

case "$CMD" in
  deploy|full)
    deploy_full
    ;;
  api)
    deploy_api_only
    ;;
  web)
    deploy_web_only
    ;;
  ssl)
    deploy_ssl_only
    ;;
  setup)
    exec "$SCRIPT_DIR/setup.sh"
    ;;
  doctor)
    exec "$SCRIPT_DIR/doctor.sh"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    deploy_die "Comando desconhecido: $CMD (use --help)"
    ;;
esac
