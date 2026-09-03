#!/usr/bin/env bash
# Wrapper: a lógica vive em db-tunnel.mjs (Linux e Windows).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$ROOT/scripts/db-tunnel.mjs"
