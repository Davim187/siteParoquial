#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/www}"
# HTTPS: funciona sem chave SSH no VPS. Para SSH: REPO_URL=git@github.com:...
REPO_URL="${REPO_URL:-https://github.com/Davim187/siteParoquial.git}"

echo "==> Instalando dependências do sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin não encontrado. Verifique a instalação do Docker."
  exit 1
fi

echo "==> Removendo Apache/Nginx do sistema (libera porta 80)..."
bash "$(dirname "$0")/remove-apache.sh"

echo "==> Firewall (portas 22, 80, 443)..."
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true

mkdir -p "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Clonando repositório em $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "==> Repositório já existe em $APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env.production ]; then
  echo "==> Criando .env.production a partir do exemplo..."
  cp .env.production.example .env.production
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s/troque-esta-chave-em-producao-minimo-32-caracteres-aleatoria/$JWT_SECRET/" .env.production
  echo
  echo "IMPORTANTE: edite $APP_DIR/.env.production"
  echo "  - POSTGRES_PASSWORD (e o mesmo valor em DATABASE_URL)"
  echo "  - CORS_ORIGIN e PUBLIC_URL (domínio ou IP público)"
  echo
fi

echo "==> Setup concluído."
echo "Próximo passo: bash deploy/deploy.sh"
