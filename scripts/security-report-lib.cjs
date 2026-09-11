'use strict';

const API_ORIGIN = 'https://api.github.com';
const REPORT_MARKER = '<!-- bingoblitz-security-report:v1 -->';
const AUTOFIX_MARKER = /<!-- bingoblitz-autofix:alert=(\d+);base=([a-f0-9]{40}) -->/;

class GitHubError extends Error {
  constructor(status, route) {
    super(`GitHub API ${status}: ${route.split('?')[0]}`);
    this.status = status;
  }
}

function createClient({ token, repository, fetchImpl = fetch }) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || '')) throw new Error('Invalid repository');
  if (!token) throw new Error('GH_TOKEN is required');
  const prefix = `/repos/${repository}`;
  async function request(method, route, body) {
    if (!route.startsWith(`${prefix}/`) && route !== prefix) throw new Error('API route is outside repository');
    const url = new URL(route, API_ORIGIN);
    if (url.origin !== API_ORIGIN || (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`))) throw new Error('Normalized API route is outside repository');
    const response = await fetchImpl(url.toString(), {
      method, redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) throw new GitHubError(response.status, route);
    if (response.status === 204) return null;
    const text = await response.text();
    if (text.length > 4_000_000) throw new Error('API response exceeded local safety limit');
    return text ? JSON.parse(text) : null;
  }
  async function list(route, limit = 3) {
    if (route.includes('/dependabot/alerts')) {
      const batch = await request('GET', `${route}${route.includes('?') ? '&' : '?'}per_page=100`);
      return { items: Array.isArray(batch) ? batch : [], truncated: false };
    }
    const items = [];
    for (let page = 1; page <= limit; page++) {
      const batch = await request('GET', `${route}${route.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      if (!Array.isArray(batch)) throw new Error('Expected paginated array');
      items.push(...batch);
      if (batch.length < 100) return { items, truncated: false };
    }
    return { items, truncated: true };
  }
  async function advisory(id) {
    if (!/^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(id || '')) throw new Error('Invalid GHSA identifier');
    const route = `/advisories/${id}`;
    const response = await fetchImpl(`${API_ORIGIN}${route}`, {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
    });
    if (!response.ok) throw new GitHubError(response.status, route);
    const text = await response.text();
    if (text.length > 200000) throw new Error('Advisory response exceeded safety limit');
    return JSON.parse(text);
  }
  return { repository, prefix, request, list, advisory };
}

function safeText(value, limit = 600) {
  return String(value ?? '—').slice(0, limit).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\|/g, '&#124;').replace(/`/g, '&#96;').replace(/\[/g, '&#91;').replace(/\]/g, '&#93;')
    .replace(/\r?\n/g, ' ').replace(/@/g, '@​');
}
function validSha(value) { return /^[a-f0-9]{40}$/.test(value || ''); }
function githubUrl(repository, path) { return `https://github.com/${repository}/${path}`; }

async function trustedRun(client, event, workflowFile) {
  const repository = await client.request('GET', client.prefix);
  const run = event.workflow_run;
  if (!run || event.repository?.id !== repository.id || run.head_repository?.id !== repository.id || !validSha(run.head_sha)) return null;
  if (run.status !== 'completed') return null;
  const workflow = await client.request('GET', `${client.prefix}/actions/workflows/${workflowFile}`);
  if (run.workflow_id !== workflow.id) return null;
  return { repository, run };
}

async function optionalList(client, route) {
  try { return { ...(await client.list(route)), unavailable: null }; }
  catch (error) {
    if (error instanceof GitHubError && [400, 403, 404, 422].includes(error.status)) return { items: [], truncated: false, unavailable: `Unavailable (HTTP ${error.status}); not evidence of zero findings.` };
    throw error;
  }
}

function codeRows(repository, alerts) {
  return alerts.map((alert) => {
    const tags = (alert.rule?.tags || []).filter((tag) => /^external\/cwe\/cwe-\d+$/.test(tag)).map((tag) => tag.split('/').at(-1).toUpperCase());
    const location = alert.most_recent_instance?.location || {};
    const link = Number.isSafeInteger(alert.number) ? `[${alert.number}](${githubUrl(repository, `security/code-scanning/${alert.number}`)})` : '—';
    return `| ${link} | ${safeText(alert.rule?.id)} | ${safeText(alert.rule?.security_severity_level || alert.rule?.severity)} | ${safeText(tags.join(', ') || 'CWE not supplied')} | ${safeText(location.path)}:${safeText(location.start_line)} |`;
  });
}
function dependencyRows(repository, alerts) {
  return alerts.map((alert) => {
    const advisory = alert.security_advisory || {};
    const vulnerability = alert.security_vulnerability || {};
    const link = Number.isSafeInteger(alert.number) ? `[${alert.number}](${githubUrl(repository, `security/dependabot/${alert.number}`)})` : '—';
    return `| ${link} | ${safeText(alert.dependency?.package?.name)} | ${safeText(advisory.ghsa_id)} | ${safeText(advisory.cve_id || 'No CVE assigned')} | ${safeText(advisory.severity)} | ${safeText(vulnerability.vulnerable_version_range)} | ${safeText(vulnerability.first_patched_version?.identifier || 'No patched version supplied')} |`;
  });
}

module.exports = { createClient, GitHubError, safeText, validSha, githubUrl, trustedRun, optionalList, codeRows, dependencyRows, REPORT_MARKER, AUTOFIX_MARKER };
