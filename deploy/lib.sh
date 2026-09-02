#!/usr/bin/env bash

resolve_app_dir() {
  if [ -n "${APP_DIR:-}" ]; then
    printf '%s\n' "$APP_DIR"
    return
  fi

  local lib_dir
  lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  if [ -f "$lib_dir/../docker-compose.prod.yml" ]; then
    cd "$lib_dir/.." && pwd
    return
  fi

  if [ -d /var/www/.git ]; then
    printf '%s\n' /var/www
    return
  fi

  printf '%s\n' /www
}

read_env_value() {
  local key="$1"
  local file="$2"
  local line value

  line="$(grep -E "^${key}=" "$file" | tail -1 || true)"
  if [ -z "$line" ]; then
    return 1
  fi

  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"

  if [ -z "$value" ]; then
    return 1
  fi

  printf '%s\n' "$value"
}

git_sync_branch() {
  local branch="${1:?branch obrigatório}"
  local repo="${GITHUB_REPOSITORY:-Davim187/siteParoquial}"
  local token="${DEPLOY_GITHUB_TOKEN:-${GITHUB_TOKEN:-}}"

  export GIT_TERMINAL_PROMPT=0

  if [ -n "$token" ]; then
    git remote set-url origin "https://x-access-token:${token}@github.com/${repo}.git"
  fi

  # Evita prompt de credencial quando o remote está em HTTPS sem token.
  git -c credential.helper= fetch origin --prune
  git checkout "$branch"
  git reset --hard "origin/$branch"
}

validate_env_production() {
  local file="$1"

  if [ ! -f "$file" ]; then
    echo "Arquivo $file não encontrado."
    echo "Rode: cp .env.production.example .env.production && nano .env.production"
    exit 1
  fi

  if ! read_env_value POSTGRES_PASSWORD "$file" >/dev/null; then
    echo "POSTGRES_PASSWORD não está definido em $file"
    echo ""
    echo "Edite o arquivo e adicione uma senha forte, por exemplo:"
    echo "  POSTGRES_PASSWORD=MinhaSenhaSegura123"
    exit 1
  fi

  if ! read_env_value JWT_SECRET "$file" >/dev/null; then
    echo "JWT_SECRET não está definido em $file"
    exit 1
  fi

  if ! read_env_value DATABASE_URL "$file" >/dev/null; then
    echo "DATABASE_URL não está definido em $file"
    echo "Use o mesmo usuário/senha/banco de POSTGRES_* com host postgres (rede Docker)."
    exit 1
  fi
}
