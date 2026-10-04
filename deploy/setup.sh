#!/usr/bin/env bash
# Configuração inicial do VPS (rode uma vez).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT_DIR="$SCRIPT_DIR"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_DIR="${APP_DIR:-/var/www}"
REPO_URL="${REPO_URL:-https://github.com/Davim187/siteParoquial.git}"

deploy_log "Instalando pacotes do sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git ufw apache2 openssl libheif1 imagemagick

if ! command -v node >/dev/null 2>&1 || [ "$(node -p "process.versions.node.split('.')[0]")" -lt 20 ]; then
  deploy_log "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  deploy_log "Instalando PM2..."
  npm install -g pm2
  pm2 startup systemd -u root --hp /root || true
fi

if ! command -v docker >/dev/null 2>&1; then
  deploy_log "Instalando Docker (Postgres)..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker && systemctl start docker
fi

docker compose version >/dev/null 2>&1 \
  || deploy_die "Docker Compose não encontrado"

deploy_log "Firewall (22, 80, 443)..."
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

mkdir -p "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  deploy_log "Clonando repositório em $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env.production ]; then
  deploy_log "Criando .env.production..."
  cp .env.production.example .env.production
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s/troque-esta-chave-em-producao-minimo-32-caracteres-aleatoria/$JWT_SECRET/" .env.production
  echo
  echo "IMPORTANTE: edite $APP_DIR/.env.production"
  echo "  POSTGRES_PASSWORD + DATABASE_URL (127.0.0.1)"
  echo "  PUBLIC_URL + CORS_ORIGIN (domínio com https://)"
  echo "  ACME_EMAIL"
  echo
fi

export APP_DIR
configure_apache

deploy_log "Setup concluído — próximo passo: bash deploy/deploy.sh"
