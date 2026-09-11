'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createClient, GitHubError, safeText, dependencyRows, codeRows } = require('./security-report-lib.cjs');
const { runRemediation } = require('./remediate-codeql.cjs');
const { buildReport, runReport, latestRuns } = require('./security-report.cjs');

const SHA = 'a'.repeat(40);
const FIX = 'b'.repeat(40);
const PREFIX = '/repos/test-owner/test-repo';
const repository = { id: 12, default_branch: 'main' };
const run = { id: 20, workflow_id: 10, head_repository: { id: 12 }, head_sha: SHA, head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success', name: 'CodeQL' };
const event = { repository, workflow_run: run };
const alert = { number: 7, tool: { name: 'CodeQL' }, rule: { id: 'js/sql-injection', security_severity_level: 'high', tags: ['external/cwe/cwe-089'] }, most_recent_instance: { commit_sha: SHA, location: { path: 'scripts/scan-demo.cjs', start_line: 14 } } };
function mock(overrides = {}) {
  const calls = [];
  const client = {
    repository: 'test-owner/test-repo', prefix: PREFIX,
    async request(method, route, body) {
      calls.push({ method, route, body });
      if (overrides.request) {
        const result = await overrides.request(method, route, body, calls);
        if (result !== undefined) return result;
      }
      if (route === PREFIX) return repository;
      if (route.endsWith('/actions/workflows/codeql.yml') || route.endsWith('/actions/workflows/ci.yml')) return { id: 10 };
      if (route.endsWith('/git/ref/heads/main')) return { object: { sha: SHA } };
      if (route.endsWith('/autofix')) return { status: 'success' };
      if (route.endsWith('/git/refs')) return {};
      if (route.endsWith('/autofix/commits')) return { target_ref: `refs/heads/autofix/codeql-7-${SHA.slice(0, 12)}`, sha: FIX };
      if (route.endsWith(`/commits/${FIX}`)) return { files: [{ filename: 'scripts/scan-demo.cjs' }] };
      if (route === `${PREFIX}/pulls` && method === 'POST') return { number: 22 };
      if (route.endsWith('/dispatches')) return null;
      throw new Error(`Unexpected mock request ${method} ${route}`);
    },
    async list(route) {
      calls.push({ method: 'LIST', route });
      if (overrides.list) {
        const result = await overrides.list(route);
        if (result !== undefined) return result;
      }
      if (route.includes('/code-scanning/alerts?')) return { items: [alert], truncated: false };
      if (route.includes('/pulls?')) return { items: [], truncated: false };
      throw new Error(`Unexpected list ${route}`);
    }
  };
  return { client, calls };
}
function options(client, extras = {}) { return { client, event, eventName: 'workflow_run', ref: 'refs/heads/main', enabled: 'true', wait: async () => {}, ...extras }; }

test('disabled remediation never contacts GitHub', async () => {
  const { client, calls } = mock();
  assert.match((await runRemediation(options(client, { enabled: 'false' })))[0], /disabled/);
  assert.equal(calls.length, 0);
});

test('fork run and wrong workflow cannot trigger mutations', async () => {
  for (const change of [{ head_repository: { id: 999 } }, { workflow_id: 99 }]) {
    const { client, calls } = mock();
    const result = await runRemediation(options(client, { event: { repository, workflow_run: { ...run, ...change } } }));
    assert.match(result[0], /Skipped/);
    assert.ok(calls.every((call) => call.method === 'GET'));
  }
});

test('stale main scan cannot create a branch or repair', async () => {
  const { client, calls } = mock({ request: (_method, route) => route.endsWith('/git/ref/heads/main') ? { object: { sha: FIX } } : undefined });
  assert.match((await runRemediation(options(client)))[0], /stale/);
  assert.ok(calls.every((call) => call.method === 'GET'));
});

test('native Autofix commit creates a draft PR and dispatches CI and CodeQL', async () => {
  const { client, calls } = mock({ request: (_method, route) => route.endsWith('/autofix') ? { status: 'success', description: 'Parameterize query <input> @everyone' } : undefined });
  const result = await runRemediation(options(client));
  assert.ok(result.some((line) => line.includes('Created draft PR #22')));
  const commit = calls.find((call) => call.route.endsWith('/autofix/commits'));
  assert.equal(commit.body.target_ref, `refs/heads/autofix/codeql-7-${SHA.slice(0, 12)}`);
  const pr = calls.find((call) => call.route === `${PREFIX}/pulls`);
  assert.equal(pr.body.draft, true);
  assert.match(pr.body.body, /Patch proposed — not yet verified fixed/);
  assert.match(pr.body.body, /Parameterize query &lt;input&gt;/);
  assert.doesNotMatch(pr.body.body, /@everyone/);
  assert.equal(calls.filter((call) => call.route.endsWith('/dispatches')).length, 2);
  assert.ok(calls.every((call) => !call.route.endsWith('/merge')));
});

test('same alert/base pair deduplicates; a new session SHA is independent', async () => {
  for (const [base, expected] of [[SHA, 0], [FIX, 1]]) {
    const { client, calls } = mock({ list: (route) => route.includes('/pulls?') ? { items: [{ head: { ref: 'autofix/codeql-7-old' }, body: `<!-- bingoblitz-autofix:alert=7;base=${base} -->` }], truncated: false } : undefined });
    await runRemediation(options(client));
    assert.equal(calls.filter((call) => call.route === `${PREFIX}/pulls`).length, expected);
  }
});

test('out-of-scope file, rule and stale alert are ignored', async () => {
  for (const changed of [
    { ...alert, rule: { id: 'js/some-other-rule' } },
    { ...alert, most_recent_instance: { commit_sha: SHA, location: { path: 'apps/api/src/app.ts' } } },
    { ...alert, most_recent_instance: { ...alert.most_recent_instance, commit_sha: FIX } }
  ]) {
    const { client, calls } = mock({ list: (route) => route.includes('/code-scanning/alerts?') ? { items: [changed], truncated: false } : undefined });
    await runRemediation(options(client));
    assert.equal(calls.filter((call) => call.method === 'POST').length, 0);
  }
});

test('pending Autofix is bounded and never reported fixed', async () => {
  const { client, calls } = mock({ request: (_method, route) => route.endsWith('/autofix') ? { status: 'pending' } : undefined });
  const result = await runRemediation(options(client, { polls: 2 }));
  assert.equal(calls.filter((call) => call.route.endsWith('/autofix')).length, 3);
  assert.ok(result.some((line) => line.includes('status pending')));
  assert.equal(calls.filter((call) => call.route.endsWith('/git/refs')).length, 0);
});

test('GitHub refusal is explicit, with no fake repair', async () => {
  const { client, calls } = mock({ request: (_method, route) => { if (route.endsWith('/autofix')) throw new GitHubError(403, route); } });
  const result = await runRemediation(options(client));
  assert.ok(result.some((line) => line.includes('HTTP 403')));
  assert.equal(calls.filter((call) => call.route === `${PREFIX}/pulls`).length, 0);
});

test('unsafe Autofix file changes are never dispatched for execution', async () => {
  const { client, calls } = mock({ request: (_method, route) => route.endsWith(`/commits/${FIX}`) ? { files: [{ filename: '.github/workflows/ci.yml' }] } : undefined });
  const result = await runRemediation(options(client));
  assert.ok(result.some((line) => line.includes('outside the single-file demo scope')));
  assert.equal(calls.filter((call) => call.route.endsWith('/dispatches') || call.route === `${PREFIX}/pulls`).length, 0);
});

test('existing remediation branches are never overwritten', async () => {
  const { client, calls } = mock({ request: (_method, route) => { if (route.endsWith('/git/refs')) throw new GitHubError(422, route); } });
  const result = await runRemediation(options(client));
  assert.ok(result.some((line) => line.includes('refusing to overwrite')));
  assert.equal(calls.filter((call) => call.route.endsWith('/autofix/commits')).length, 0);
});

test('report escapes untrusted markdown and never includes secret fields', () => {
  assert.doesNotMatch(safeText('<script> @everyone | `x`\n'), /<script>|@everyone|\||`|\n/);
  assert.match(codeRows('a/b', [alert]).join('\n'), /CWE-089/);
  const result = dependencyRows('a/b', [{ number: 1, raw_secret: 'DO-NOT-PRINT', security_advisory: { ghsa_id: 'GHSA-test', cve_id: null }, dependency: { package: { name: 'example' } } }]).join('\n');
  assert.match(result, /No CVE assigned/);
  assert.doesNotMatch(result, /DO-NOT-PRINT/);
});

test('API client never follows redirects or sends tokens outside the repository API', async () => {
  let observed;
  const client = createClient({ token: 'synthetic-test-token', repository: 'a/b', fetchImpl: async (url, init) => { observed = { url, init }; return { ok: true, status: 200, text: async () => '{}' }; } });
  await client.request('GET', '/repos/a/b');
  assert.equal(observed.url, 'https://api.github.com/repos/a/b');
  assert.equal(observed.init.redirect, 'error');
  await assert.rejects(client.request('GET', 'https://evil.invalid'), /outside repository/);
  await assert.rejects(client.request('GET', '/repos/a/other'), /outside repository/);
  await assert.rejects(client.request('GET', '/repos/a/b/../../other'), /outside repository/);
});

test('latest checks only include the current PR commit', () => {
  const checks = latestRuns([{ name: 'CI', head_sha: SHA, id: 1, conclusion: 'failure' }, { name: 'CI', head_sha: SHA, id: 2, conclusion: 'success' }, { name: 'CodeQL', head_sha: FIX, id: 3, conclusion: 'success' }], SHA);
  assert.equal(checks.get('CI').conclusion, 'success');
  assert.equal(checks.has('CodeQL'), false);
});

test('report requires current scan evidence and successful checks before claiming target absent', async () => {
  const pr = { number: 22, head: { sha: FIX, ref: 'autofix/codeql-7-aaaa' }, base: { ref: 'main' }, body: `<!-- bingoblitz-autofix:alert=7;base=${SHA} -->` };
  for (const verified of [false, true]) {
    const client = {
      repository: 'test-owner/test-repo', prefix: PREFIX,
      request: async () => ({ workflow_runs: ['CI', 'CodeQL'].map((name, i) => ({ name, id: i + 1, head_sha: FIX, conclusion: verified ? 'success' : 'failure' })) }),
      list: async (route) => {
        if (route.includes('/analyses?')) return { items: verified ? [{ commit_sha: FIX, error: '', tool: { name: 'CodeQL' }, category: '/language:javascript-typescript' }] : [], truncated: false };
        return { items: [], truncated: false };
      }
    };
    const body = await buildReport(client, pr);
    assert.match(body, verified ? /no longer reported on the current analyzed ref/ : /repair proposed; verification incomplete/);
    assert.match(body, /repository-level Dependabot alerts/);
  }
});

test('fork workflow completion cannot post a report', async () => {
  const { client, calls } = mock();
  const result = await runReport({ client, event: { ...event, workflow_run: { ...run, head_repository: { id: 999 } } } });
  assert.match(result[0], /untrusted/);
  assert.ok(calls.every((call) => call.method === 'GET'));
});

test('privileged workflows check out workflow SHA without persisted credentials or package execution', () => {
  for (const name of ['autofix.yml', 'security-report.yml']) {
    const content = fs.readFileSync(path.join(__dirname, '../.github/workflows', name), 'utf8');
    assert.match(content, /ref: \$\{\{ github.workflow_sha \}\}/);
    assert.match(content, /persist-credentials: false/);
    assert.doesNotMatch(content, /pull_request_target|npm (install|ci)|head_sha \}\}/);
  }
});
