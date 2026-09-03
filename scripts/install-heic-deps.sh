#!/usr/bin/env bash
# Wrapper: a lógica vive em install-heic-deps.mjs (Linux e Windows).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$ROOT/scripts/install-heic-deps.mjs"
