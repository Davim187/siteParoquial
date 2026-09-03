#!/usr/bin/env bash
# Biblioteca compartilhada — carrega todos os módulos de deploy.

DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=lib/common.sh
source "$DEPLOY_LIB_DIR/common.sh"
# shellcheck source=lib/build.sh
source "$DEPLOY_LIB_DIR/build.sh"
# shellcheck source=lib/postgres.sh
source "$DEPLOY_LIB_DIR/postgres.sh"
# shellcheck source=lib/pm2.sh
source "$DEPLOY_LIB_DIR/pm2.sh"
# shellcheck source=lib/apache.sh
source "$DEPLOY_LIB_DIR/apache.sh"
