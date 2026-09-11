const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function fixture(t, ignored = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bingo-local-tools-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.copyFileSync(path.join(__dirname, 'init-local-env.sh'), path.join(root, 'scripts/init-local-env.sh'));
  const git = spawnSync('git', ['init', '--quiet'], { cwd: root, encoding: 'utf8' });
  assert.equal(git.status, 0);
  if (ignored) fs.writeFileSync(path.join(root, '.gitignore'), '.env\n');
  return root;
}
function run(root, args = []) {
  return spawnSync('bash', ['scripts/init-local-env.sh', ...args], { cwd: root, encoding: 'utf8' });
}

test('environment initialization is dry-run by default', (t) => {
  const root = fixture(t);
  assert.equal(run(root).status, 0);
  assert.equal(fs.existsSync(path.join(root, '.env')), false);
});

test('generated configuration is ignored, private and not printed', (t) => {
  const root = fixture(t);
  const result = run(root, ['--apply']);
  assert.equal(result.status, 0, result.stderr);
  const file = path.join(root, '.env');
  const content = fs.readFileSync(file, 'utf8');
  assert.match(content, /JWT_SECRET=[a-f0-9]{96}/);
  assert.match(content, /POSTGRES_PASSWORD=[a-f0-9]{48}/);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.doesNotMatch(result.stdout + result.stderr, /JWT_SECRET=|POSTGRES_PASSWORD=/);
  const second = run(root, ['--apply']);
  assert.equal(second.status, 1);
  assert.equal(fs.readFileSync(file, 'utf8'), content);
});

test('refuses to create a credential file that Git would track', (t) => {
  const root = fixture(t, false);
  const result = run(root, ['--apply']);
  assert.equal(result.status, 1);
  assert.equal(fs.existsSync(path.join(root, '.env')), false);
});

test('seed reports missing DATABASE_URL with failure exit', () => {
  const env = { ...process.env };
  delete env.DATABASE_URL;
  const result = spawnSync(process.execPath, [path.join(__dirname, 'seed.cjs')], { env, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DATABASE_URL is required/);
  assert.doesNotMatch(result.stdout, /verified|success/i);
});
