'use strict';

const fs = require('node:fs');
const { createClient, GitHubError, trustedRun, safeText, githubUrl, validSha } = require('./security-report-lib.cjs');

const RULES = new Set(['js/sql-injection', 'js/reflected-xss']);
const SOURCE = 'scripts/scan-demo.cjs';
const MAX_ALERTS = 2;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runRemediation({ client, event, eventName, ref, enabled, wait = sleep, polls = 12 }) {
  const notes = [];
  if (enabled !== 'true') return ['Autofix automation is disabled. Set DEMO_AUTOFIX_ENABLED=true only after reviewing its permissions.'];
  let context;
  if (eventName === 'workflow_run') {
    context = await trustedRun(client, event, 'codeql.yml');
  } else if (eventName === 'workflow_dispatch') {
    const repository = await client.request('GET', client.prefix);
    if (ref !== 'refs/heads/main' || repository.default_branch !== 'main') return ['Manual remediation is allowed only from the main default branch.'];
    const result = await client.request('GET', `${client.prefix}/actions/workflows/codeql.yml/runs?branch=main&event=push&status=success&per_page=1`);
    const run = result.workflow_runs?.[0];
    if (run) context = await trustedRun(client, { repository, workflow_run: run }, 'codeql.yml');
  }
  if (!context) return ['Skipped: no trusted completed CodeQL run was found.'];
  const { repository, run } = context;
  if (repository.default_branch !== 'main' || run.head_branch !== 'main' || run.event !== 'push' || run.conclusion !== 'success') {
    return ['Skipped: automatic remediation requires a successful main/default-branch push analysis.'];
  }
  const sha = run.head_sha;
  async function currentBase() {
    const branch = await client.request('GET', `${client.prefix}/git/ref/heads/main`);
    return branch.object?.sha === sha;
  }
  if (!(await currentBase())) return ['Skipped stale analysis: main changed after this scan.'];
  const listed = await client.list(`${client.prefix}/code-scanning/alerts?state=open&ref=refs%2Fheads%2Fmain`);
  if (listed.truncated) notes.push('Alert discovery limited to first 300 alerts; remaining alerts were not inspected.');
  const eligible = listed.items.filter((alert) => Number.isSafeInteger(alert.number)
    && alert.tool?.name === 'CodeQL' && RULES.has(alert.rule?.id)
    && alert.most_recent_instance?.location?.path === SOURCE
    && alert.most_recent_instance?.commit_sha === sha);
  notes.push(`Found ${eligible.length} eligible demo alert(s); processing at most ${MAX_ALERTS}. Other files/rules are intentionally excluded.`);
  const open = await client.list(`${client.prefix}/pulls?state=open&base=main`);
  if (open.truncated) return [...notes, 'Skipped: open-PR discovery truncated, so deduplication cannot be guaranteed.'];

  for (const alert of eligible.slice(0, MAX_ALERTS)) {
    if (open.items.some((pr) => pr.head?.ref?.startsWith('autofix/codeql-') && String(pr.body).includes(`bingoblitz-autofix:alert=${alert.number};base=${sha} -->`))) {
      notes.push(`Alert #${alert.number}: an open remediation PR already exists; no duplicate created.`);
      continue;
    }
    const route = `${client.prefix}/code-scanning/alerts/${alert.number}/autofix`;
    try {
      let fix = await client.request('POST', route);
      for (let attempt = 0; fix?.status === 'pending' && attempt < polls; attempt++) {
        await wait(10000);
        fix = await client.request('GET', route);
      }
      if (fix?.status !== 'success') {
        notes.push(`Alert #${alert.number}: Autofix status ${safeText(fix?.status || 'unknown')}; no repair claimed. Retry a later manual run if pending.`);
        continue;
      }
      if (!(await currentBase())) { notes.push('Stopped: main advanced while Autofix was generating.'); break; }
      const branch = `autofix/codeql-${alert.number}-${sha.slice(0, 12)}`;
      try {
        await client.request('POST', `${client.prefix}/git/refs`, { ref: `refs/heads/${branch}`, sha });
      } catch (error) {
        if (error instanceof GitHubError && error.status === 422) {
          notes.push(`Alert #${alert.number}: target branch already exists; refusing to overwrite it. Inspect it before retrying.`);
          continue;
        }
        throw error;
      }
      const committed = await client.request('POST', `${route}/commits`, {
        target_ref: `refs/heads/${branch}`,
        message: `fix: apply GitHub Copilot Autofix for CodeQL alert #${alert.number}\n\nCo-Authored-By: Claude Code <noreply@anthropic.com>`
      });
      if (!validSha(committed?.sha) || committed.target_ref !== `refs/heads/${branch}`) throw new Error('Unexpected Autofix commit response');
      const commit = await client.request('GET', `${client.prefix}/commits/${committed.sha}`);
      if (!commit.files?.length || commit.files.some((file) => file.filename !== SOURCE || (file.previous_filename && file.previous_filename !== SOURCE))) {
        notes.push(`Alert #${alert.number}: proposed patch changed files outside the single-file demo scope. Branch retained for inspection; no PR/workflows dispatched.`);
        continue;
      }
      if (!(await currentBase())) { notes.push(`Alert #${alert.number}: base moved after commit; branch retained, PR creation skipped.`); break; }
      const body = [
        `<!-- bingoblitz-autofix:alert=${alert.number};base=${sha} -->`,
        '## GitHub Copilot Autofix 資安弱點修復提案',
        '',
        `- 發現弱點：[CodeQL Alert #${alert.number}](${githubUrl(client.repository, `security/code-scanning/${alert.number}`)})`,
        `- 規則 (Rule)：${safeText(alert.rule.id)}；嚴重度：${safeText(alert.rule.security_severity_level || alert.rule.severity)}`,
        `- 檔案位置：${safeText(SOURCE)}:${safeText(alert.most_recent_instance.location.start_line)}`,
        `- 分類：${safeText((alert.rule.tags || []).filter((tag) => /^external\/cwe\/cwe-\d+$/.test(tag)).join(', ') || '未提供 CWE')}。應用程式程式碼缺陷通常無 CVE 編號。`,
        `- 分析基準 Commit (Base)：${sha}`,
        `- 提案修復 Commit：${committed.sha}`,
        `- 來源分析 Run：${githubUrl(client.repository, `actions/runs/${run.id}`)}`,
        '',
        '### 變更說明 (What changed)',
        '本修補 Patch 由 GitHub CodeQL Autofix API 自動產生並提交。請點開「Files changed」檢視 Diff；此處絕不以手寫程式碼冒充 AI 產出。',
        `GitHub Autofix 自動說明：${safeText(fix.description || 'GitHub 未提供說明。', 3500)}`,
        '',
        '### 驗證狀態 (Verification)',
        '**修補已提出 — 尚未完成驗證 (Patch proposed — not yet verified fixed)。** 系統已主動派發 CI 與 CodeQL 重新分析（因 GITHUB_TOKEN 提交預設不觸發 Actions）。即時驗證進度請見下方的安全報告留言。',
        '',
        '### 人工審查檢查清單 (Human review)',
        '- [ ] 審查 Patch 內容與相關弱點 CWE。',
        '- [ ] 確認 CI 與 CodeQL 驗證證據已套用於當前 PR Head。',
        '- [ ] 待所有必要檢查通過後，由專案管理員手動核准並合併 (Approve and Merge)。',
        '',
        '本流程不會自動核准、不會自動合併、不會繞過保護，亦不會直接部署。',
        '',
        '🤖 Generated with [Claude Code](https://claude.com/claude-code)'
      ].join('\n');
      const pr = await client.request('POST', `${client.prefix}/pulls`, {
        title: `fix(security): Copilot Autofix 自動修復 ${alert.rule.id} (#${alert.number})`, head: branch, base: 'main', body, draft: true, maintainer_can_modify: false
      });
      open.items.push({ ...pr, head: { ref: branch }, body });
      notes.push(`Created draft PR #${pr.number} for alert #${alert.number}; patch proposed, human review required.`);
      for (const workflow of ['ci.yml', 'codeql.yml']) {
        try {
          await client.request('POST', `${client.prefix}/actions/workflows/${workflow}/dispatches`, { ref: branch });
          notes.push(`PR #${pr.number}: dispatched ${workflow}.`);
        } catch (error) {
          if (!(error instanceof GitHubError)) throw error;
          notes.push(`PR #${pr.number}: ${workflow} dispatch failed (HTTP ${error.status}); run it manually. Verification is pending.`);
        }
      }
    } catch (error) {
      if (!(error instanceof GitHubError)) throw error;
      notes.push(`Alert #${alert.number}: GitHub Autofix unavailable/failed (HTTP ${error.status}). No successful repair is claimed.`);
    }
  }
  return notes;
}

async function main() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const client = createClient({ token: process.env.GH_TOKEN, repository: process.env.GITHUB_REPOSITORY });
  const notes = await runRemediation({ client, event, eventName: process.env.GITHUB_EVENT_NAME, ref: process.env.GITHUB_REF, enabled: process.env.DEMO_AUTOFIX_ENABLED });
  const summary = `## Autofix orchestration\n\n${notes.map((note) => `- ${note}`).join('\n')}\n`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
if (require.main === module) main().catch((error) => { console.error(error instanceof GitHubError ? error.message : 'Autofix orchestration failed; no repair success is claimed.'); process.exitCode = 1; });
module.exports = { runRemediation, SOURCE, RULES };
