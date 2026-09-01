#!/usr/bin/env bash
# Instala conversores HEIC no Linux (dev local). Rode com sudo se necessário.
set -euo pipefail

if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    imagemagick \
    libheif1 \
    libheif-examples
  echo "==> Instalado. Teste: magick -version && heif-convert --version"
else
  echo "Instale manualmente: imagemagick + libheif"
  exit 1
fi
