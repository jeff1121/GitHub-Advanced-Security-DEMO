#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
case "${1:-}" in
  --container)
    exec docker compose --project-directory "$ROOT" exec -T api node scripts/seed.cjs
    ;;
  '')
    exec node "$ROOT/scripts/seed.cjs"
    ;;
  *)
    printf 'Usage: bash scripts/seed.sh [--container]\n' >&2
    exit 2
    ;;
esac
