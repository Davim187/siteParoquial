#!/usr/bin/env bash
# Wrapper: a lógica vive em ensure-db-tunnel.mjs (Linux e Windows).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$ROOT/scripts/ensure-db-tunnel.mjs"
