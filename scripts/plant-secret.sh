#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "${1:-}" != '--apply' ]]; then
  printf '%s\n' 'Dry run: prepare a synthetic Azure-shaped test fixture on local demo/act1-leak-key.'
  printf '%s\n' 'No commit or push is performed. This does NOT prove GitHub will detect or block it.'
  printf '%s\n' 'After the branch is prepared, use --apply to create a new file; existing files are never overwritten.'
  exit 0
fi
branch="$(git -C "$ROOT" branch --show-current)"
if [[ "$branch" != 'demo/act1-leak-key' ]]; then
  printf 'Refusing: current branch is %s, expected demo/act1-leak-key.\n' "$branch" >&2
  exit 1
fi
if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
  printf 'Refusing: working tree contains changes. Preserve them before preparing a scenario.\n' >&2
  exit 1
fi
node - "$ROOT" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const root = process.argv[2];
const dir = path.join(root, 'demo-fixtures');
if (fs.existsSync(dir) && fs.lstatSync(dir).isSymbolicLink()) {
  throw new Error('Refusing symbolic-link fixture directory.');
}
fs.mkdirSync(dir, { recursive: true });
const filename = path.join(dir, 'azure-sample.ts');
const content = [
  '// Synthetic educational fixture; never used by the application.',
  'export const AZURE_OPENAI_ENDPOINT = "https://synthetic-demo.invalid";',
  `export const AZURE_OPENAI_API_KEY = "${randomBytes(16).toString('hex')}";`,
  `export const AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=syntheticdemo;AccountKey=${randomBytes(64).toString('base64')};EndpointSuffix=core.windows.net";`,
  ''
].join('\n');
fs.writeFileSync(filename, content, { flag: 'wx', mode: 0o600 });
console.log('Created demo-fixtures/azure-sample.ts from local randomness, not a provider credential.');
console.log('NOT committed or pushed. Require second-person provenance review and separate publication authorization.');
console.log('Detection and Push Protection remain unverified. Do not bypass protection.');
NODE
