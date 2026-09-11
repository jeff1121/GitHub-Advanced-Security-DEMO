const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('./security-report-lib.cjs');
const { latestRuns } = require('./security-report.cjs');

test('public CVE lookup never transmits the repository token', async () => {
  let captured;
  const client = createClient({ token: 'synthetic-test-token', repository: 'example/demo', fetchImpl: async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ ghsa_id: 'GHSA-xvch-5gv4-984h', cve_id: 'CVE-2021-44906' }));
  } });
  const result = await client.advisory('GHSA-xvch-5gv4-984h');
  assert.equal(result.cve_id, 'CVE-2021-44906');
  assert.equal(captured.url, 'https://api.github.com/advisories/GHSA-xvch-5gv4-984h');
  assert.equal(captured.options.headers.Authorization, undefined);
  assert.equal(captured.options.redirect, 'error');
  await assert.rejects(client.advisory('../../user'), /Invalid GHSA/);
});

test('explicit current-head verification is not replaced by approval-pending duplicate PR runs', () => {
  const sha = 'a'.repeat(40);
  const selected = latestRuns([
    { id: 10, name: 'CI', head_sha: sha, event: 'workflow_dispatch', conclusion: 'success' },
    { id: 11, name: 'CI', head_sha: sha, event: 'pull_request', conclusion: 'action_required' },
    { id: 12, name: 'CI', head_sha: 'b'.repeat(40), event: 'workflow_dispatch', conclusion: 'success' }
  ], sha);
  assert.equal(selected.get('CI').id, 10);
});
