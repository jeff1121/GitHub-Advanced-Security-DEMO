#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "${1:-}" != '--apply' ]]; then
  printf 'Dry run: create ignored .env with fresh local-only credentials.\nRun bash scripts/init-local-env.sh --apply to create it; existing files are never overwritten.\n'
  exit 0
fi
node - "$ROOT" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = process.argv[2];
const target = path.join(root, '.env');
try {
  execFileSync('git', ['check-ignore', '-q', '.env'], { cwd: root });
} catch {
  console.error('Refusing: .env must be ignored by Git.');
  process.exit(1);
}
const password = randomBytes(24).toString('hex');
const settings = [
  'NODE_ENV=development',
  'PORT=3001',
  'WEB_ORIGIN=http://localhost:8080',
  'POSTGRES_USER=bingo',
  'POSTGRES_DB=bingo',
  `POSTGRES_PASSWORD=${password}`,
  `DATABASE_URL=postgres://bingo:${password}@localhost:5432/bingo`,
  'REDIS_URL=redis://localhost:6379',
  `JWT_SECRET=${randomBytes(48).toString('hex')}`,
  'MOCK_AZURE=true',
  'DEMO_FAST_MODE=true',
  ''
].join('\n');
try {
  fs.writeFileSync(target, settings, { flag: 'wx', mode: 0o600 });
  console.log('Created ignored .env for local development. No credentials were printed.');
} catch (error) {
  console.error(error.code === 'EEXIST' ? 'Refusing to overwrite existing .env.' : 'Could not create .env.');
  process.exit(1);
}
NODE
