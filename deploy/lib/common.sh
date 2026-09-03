#!/usr/bin/env bash

deploy_log() {
  printf '==> %s\n' "$*"
}

deploy_warn() {
  printf 'AVISO: %s\n' "$*" >&2
}

deploy_die() {
  printf 'ERRO: %s\n' "$*" >&2
  exit 1
}

resolve_app_dir() {
  if [ -n "${APP_DIR:-}" ]; then
    printf '%s\n' "$APP_DIR"
    return
  fi

  if [ -d /var/www/.git ]; then
    printf '%s\n' /var/www
    return
  fi

  if [ -d /www/.git ]; then
    printf '%s\n' /www
    return
  fi

  if [ -n "${DEPLOY_SCRIPT_DIR:-}" ] && [ -f "$DEPLOY_SCRIPT_DIR/../docker-compose.prod.yml" ]; then
    cd "$DEPLOY_SCRIPT_DIR/.." && pwd
    return
  fi

  printf '%s\n' /var/www
}

read_env_value() {
  local key="$1"
  local file="$2"
  local line value

  line="$(grep -E "^${key}=" "$file" | tail -1 || true)"
  [ -n "$line" ] || return 1

  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"

  [ -n "$value" ] || return 1
  printf '%s\n' "$value"
}

load_env_file() {
  local file="$1"
  local line key value

  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" != *=* ]] && continue

    key="${line%%=*}"
    value="${line#*=}"
    value="${value#\"}"
    value="${value%\"}"
    value="${value#\'}"
    value="${value%\'}"

    export "$key=$value"
  done < "$file"
}

host_from_url() {
  printf '%s\n' "$1" | sed -E 's|^https?://||' | sed 's|/.*||' | sed 's|:.*||'
}

is_ip_address() {
  [[ "$1" =~ ^[0-9]+(\.[0-9]+){3}$ ]]
}

domain_from_env() {
  local file="$1"
  local key url host

  if host="$(read_env_value SITE_DOMAIN "$file" 2>/dev/null || true)" && [ -n "$host" ]; then
    host="$(host_from_url "$host")"
    if ! is_ip_address "$host"; then
      printf '%s\n' "$host"
      return 0
    fi
  fi

  for key in PUBLIC_URL CORS_ORIGIN; do
    url="$(read_env_value "$key" "$file" 2>/dev/null || true)"
    [ -z "$url" ] && continue
    host="$(host_from_url "$url")"
    if ! is_ip_address "$host"; then
      printf '%s\n' "$host"
      return 0
    fi
  done

  return 1
}

host_from_env() {
  local file="$1"
  local key url

  if host="$(read_env_value SITE_DOMAIN "$file" 2>/dev/null || true)" && [ -n "$host" ]; then
    host_from_url "$host"
    return 0
  fi

  for key in PUBLIC_URL CORS_ORIGIN; do
    url="$(read_env_value "$key" "$file" 2>/dev/null || true)"
    if [ -n "$url" ]; then
      host_from_url "$url"
      return 0
    fi
  done

  return 1
}

validate_env_production() {
  local file="$1"

  [ -f "$file" ] || deploy_die "$file não encontrado. Copie .env.production.example"

  read_env_value POSTGRES_PASSWORD "$file" >/dev/null \
    || deploy_die "POSTGRES_PASSWORD ausente em $file"
  read_env_value JWT_SECRET "$file" >/dev/null \
    || deploy_die "JWT_SECRET ausente em $file"
  read_env_value DATABASE_URL "$file" >/dev/null \
    || deploy_die "DATABASE_URL ausente em $file (use host 127.0.0.1)"
}

git_sync_branch() {
  local branch="${1:?branch obrigatório}"
  local repo="${GITHUB_REPOSITORY:-Davim187/siteParoquial}"
  local token="${DEPLOY_GITHUB_TOKEN:-${GITHUB_TOKEN:-}}"

  export GIT_TERMINAL_PROMPT=0

  if [ -n "$token" ]; then
    git remote set-url origin "https://x-access-token:${token}@github.com/${repo}.git"
  fi

  git -c credential.helper= fetch origin --prune
  git checkout "$branch"
  git reset --hard "origin/$branch"
}

deploy_init() {
  DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  APP_DIR="${APP_DIR:-$(resolve_app_dir)}"
  ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
  export APP_DIR
  cd "$APP_DIR"
}
