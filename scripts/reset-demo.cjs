const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const baseline = 'demo-baseline-v1';
const sourcePaths = ['scripts/scan-demo.cjs', 'demo-dependencies/package.json', 'demo-dependencies/package-lock.json'];
const sessionPath = 'docs/demo-session.json';
const args = process.argv.slice(2);

function git(...parameters) {
  return execFileSync('git', parameters, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
}
function regularFile(relative) {
  const absolute = path.join(root, relative);
  try {
    if (!fs.lstatSync(absolute).isFile()) throw new Error(`Refusing non-regular file: ${relative}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return absolute;
}
function reset() {
  if (args.length > 1 || (args.length === 1 && !['--apply', '--dry-run'].includes(args[0]))) {
    throw new Error('Usage: bash scripts/reset-demo.sh [--dry-run|--apply]');
  }
  if (git('branch', '--show-current') !== 'main') throw new Error('Switch to main only after preserving all local work.');
  if (git('status', '--porcelain')) throw new Error('Working tree is not clean. No files were changed. Commit or preserve your work first.');
  const sha = git('rev-parse', '--verify', `refs/tags/${baseline}^{commit}`);
  const replacements = sourcePaths.map((relative) => {
    const content = git('show', `${sha}:${relative}`) + '\n';
    const target = regularFile(relative);
    fs.readFileSync(target, { flag: fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW });
    git('ls-files', '--error-unmatch', relative);
    return { target, content };
  });
  const session = regularFile(sessionPath);
  try {
    const previous = JSON.parse(fs.readFileSync(session, { encoding: 'utf8', flag: fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW }));
    if (previous.createdBy !== 'bingoblitz-reset-demo') throw new Error('Session file was not created by this tool; refusing to overwrite it.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  console.log(`Baseline: ${baseline} (${sha})`);
  console.log(`Restore only ${sourcePaths.join(', ')}; create a fresh session marker in ${sessionPath}.`);
  console.log('No database changes, no git reset/clean, no branch deletion, no PR changes, no commits or pushes.');
  if (args[0] !== '--apply') {
    console.log('Dry run only. Review the baseline diff, then rerun with --apply.');
    return;
  }
  for (const { target, content } of replacements) fs.writeFileSync(target, content, { flag: fs.constants.O_WRONLY | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW });
  fs.writeFileSync(session, JSON.stringify({
    createdBy: 'bingoblitz-reset-demo', sessionId: randomUUID(), baseline: sha, createdAt: new Date().toISOString()
  }, null, 2) + '\n', { flag: fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW });
  console.log('Prepared a new rehearsal. Inspect git diff, then:');
  console.log('git add scripts/scan-demo.cjs demo-dependencies/package.json demo-dependencies/package-lock.json docs/demo-session.json');
  console.log('git commit -m "demo: start a fresh security rehearsal"');
  console.log('git push origin main');
  console.log('If main requires PRs, use a new branch and PR instead; never bypass repository rules.');
}
try { reset(); } catch (error) {
  console.error(error instanceof Error && error.stderr ? 'Required local baseline/ref could not be read; no remote actions were taken.' : error.message);
  process.exitCode = 1;
}
