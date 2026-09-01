#!/usr/bin/env bash
# Remove Apache (e Nginx do sistema) para liberar a porta 80 ao Docker.
set -euo pipefail

echo "==> Parando serviços web do sistema..."

for service in apache2 httpd nginx; do
  if systemctl is-active --quiet "$service" 2>/dev/null; then
    echo "   Parando $service..."
    systemctl stop "$service"
  fi
  if systemctl is-enabled --quiet "$service" 2>/dev/null; then
    echo "   Desabilitando $service..."
    systemctl disable "$service"
  fi
done

echo "==> Removendo pacotes (se instalados)..."
export DEBIAN_FRONTEND=noninteractive

if command -v apt-get >/dev/null 2>&1; then
  apt-get remove -y apache2 apache2-utils apache2-bin libapache2-mod-php* 2>/dev/null || true
  apt-get remove -y nginx nginx-common 2>/dev/null || true
  apt-get autoremove -y
elif command -v yum >/dev/null 2>&1; then
  yum remove -y httpd nginx 2>/dev/null || true
elif command -v dnf >/dev/null 2>&1; then
  dnf remove -y httpd nginx 2>/dev/null || true
fi

echo "==> Verificando porta 80..."
if ss -tlnp | grep -q ':80 '; then
  echo "AVISO: a porta 80 ainda está em uso:"
  ss -tlnp | grep ':80 ' || true
else
  echo "Porta 80 livre para o Docker."
fi

echo "==> Apache/Nginx do sistema removidos ou parados."
