#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
failed=0
printf 'BingoBlitz LOCAL preflight (does not contact GitHub)\n'
for branch in main solution/hardened demo/act1-leak-key demo/act2-new-feature; do
  if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$branch"; then
    printf 'FOUND branch: %s (%s)\n' "$branch" "$(git -C "$ROOT" rev-parse --short "$branch")"
  else
    printf 'PENDING branch: %s\n' "$branch"
    failed=1
  fi
done
for workflow in ci.yml codeql.yml dependency-review.yml; do
  if [[ -f "$ROOT/.github/workflows/$workflow" ]]; then
    printf 'PRESENT configuration: %s (not cloud verification)\n' "$workflow"
  else
    printf 'MISSING configuration: %s\n' "$workflow"
    failed=1
  fi
done
if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
  printf 'WARNING: uncommitted work exists. Do not reset or switch blindly.\n'
  failed=1
fi
if [[ ! -f "$ROOT/.env" ]]; then
  printf 'PENDING local environment: run bash scripts/init-local-env.sh --apply\n'
  failed=1
fi
printf 'GitHub Actions / alerts / Push Protection / Copilot: NOT VERIFIED by this script.\n'
exit "$failed"
