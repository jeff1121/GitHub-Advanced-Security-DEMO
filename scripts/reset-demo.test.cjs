const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bingo-reset-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-b', 'main');
  git('config', 'user.email', 'fixture@example.invalid');
  git('config', 'user.name', 'Local test');
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.mkdirSync(path.join(root, 'demo-dependencies'));
  fs.writeFileSync(path.join(root, 'demo-dependencies/package.json'), '{"private":true}\n');
  fs.writeFileSync(path.join(root, 'demo-dependencies/package-lock.json'), '{"lockfileVersion":3}\n');
  fs.copyFileSync(path.join(__dirname, 'reset-demo.cjs'), path.join(root, 'scripts/reset-demo.cjs'));
  fs.writeFileSync(path.join(root, 'scripts/scan-demo.cjs'), 'module.exports = "baseline";\n');
  fs.writeFileSync(path.join(root, 'README.md'), 'Preserve me\n');
  git('add', '.'); git('commit', '-m', 'fixture baseline'); git('tag', 'demo-baseline-v1');
  fs.writeFileSync(path.join(root, 'scripts/scan-demo.cjs'), 'module.exports = "fixed";\n');
  git('add', '.'); git('commit', '-m', 'fixture repair');
  const run = (...args) => spawnSync(process.execPath, ['scripts/reset-demo.cjs', ...args], { cwd: root, encoding: 'utf8' });
  return { root, git, run };
}

test('reset defaults to dry-run with no changes', (t) => {
  const { git, run } = fixture(t);
  assert.equal(run().status, 0);
  assert.equal(git('status', '--porcelain'), '');
});

test('reset prepares normal file changes and keeps HEAD/history intact', (t) => {
  const { root, git, run } = fixture(t);
  const before = git('rev-parse', 'HEAD');
  const result = run('--apply');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git('rev-parse', 'HEAD'), before);
  assert.equal(fs.readFileSync(path.join(root, 'scripts/scan-demo.cjs'), 'utf8'), 'module.exports = "baseline";\n');
  assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), 'Preserve me\n');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'docs/demo-session.json'), 'utf8')).createdBy, 'bingoblitz-reset-demo');
  assert.equal(run('--apply').status, 1, 'Refuse to discard prepared changes on repeat');
});

test('reset refuses dirty work and non-main branches', (t) => {
  const { root, git, run } = fixture(t);
  fs.writeFileSync(path.join(root, 'important.txt'), 'user work');
  assert.equal(run('--apply').status, 1);
  assert.equal(fs.readFileSync(path.join(root, 'important.txt'), 'utf8'), 'user work');
  git('add', '.'); git('commit', '-m', 'preserve fixture work');
  git('switch', '-c', 'solution/hardened');
  assert.equal(run('--apply').status, 1);
});
