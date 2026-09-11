'use strict';

const fs = require('node:fs');
const { createClient, GitHubError, trustedRun, optionalList, safeText, githubUrl, codeRows, dependencyRows, REPORT_MARKER, AUTOFIX_MARKER, validSha } = require('./security-report-lib.cjs');

function latestRuns(runs, sha) {
  const selected = new Map();
  for (const run of runs.filter((item) => item.head_sha === sha && ['CI', 'CodeQL'].includes(item.name))) {
    const previous = selected.get(run.name);
    const priority = (item) => item.event === 'workflow_dispatch' ? 1 : 0;
    if (!previous || priority(run) > priority(previous) || (priority(run) === priority(previous)
      && (run.id > previous.id || (run.id === previous.id && run.run_attempt > previous.run_attempt)))) selected.set(run.name, run);
  }
  return selected;
}

async function buildReport(client, pr) {
  const sha = pr.head.sha;
  const branchRef = `refs/heads/${pr.head.ref}`;
  const prRef = `refs/pull/${pr.number}/merge`;
  const runsResponse = await client.request('GET', `${client.prefix}/actions/runs?head_sha=${sha}&per_page=100`);
  const runs = latestRuns(runsResponse.workflow_runs || [], sha);
  const branchAnalyses = await optionalList(client, `${client.prefix}/code-scanning/analyses?ref=${encodeURIComponent(branchRef)}`);
  const prAnalyses = await optionalList(client, `${client.prefix}/code-scanning/analyses?ref=${encodeURIComponent(prRef)}`);
  const branchVerified = branchAnalyses.items.some((analysis) => analysis.commit_sha === sha && !analysis.error && analysis.tool?.name === 'CodeQL' && String(analysis.category).includes('javascript'));
  const mergeVerified = Boolean(pr.merge_commit_sha) && prAnalyses.items.some((analysis) => analysis.commit_sha === pr.merge_commit_sha && !analysis.error && analysis.tool?.name === 'CodeQL' && String(analysis.category).includes('javascript'));
  const chosenRef = branchVerified ? branchRef : prRef;
  const alerts = await optionalList(client, `${client.prefix}/code-scanning/alerts?state=open&ref=${encodeURIComponent(chosenRef)}`);
  const dependencies = await optionalList(client, `${client.prefix}/dependabot/alerts?state=open`);
  const dependencyDiff = validSha(pr.base.sha)
    ? await optionalList(client, `${client.prefix}/dependency-graph/compare/${pr.base.sha}...${sha}`)
    : { items: [], truncated: false, unavailable: 'Base SHA unavailable; dependency change comparison was not performed.' };
  const advisoryIds = [...new Set(dependencyDiff.items.flatMap((item) =>
    (item.vulnerabilities || []).map((entry) => entry.advisory_ghsa_id).filter(Boolean)))].slice(0, 10);
  const cves = new Map();
  if (typeof client.advisory === 'function') {
    for (const id of advisoryIds) {
      try {
        const data = await client.advisory(id);
        cves.set(id, data.withdrawn_at ? 'Withdrawn advisory' : (data.cve_id || 'No CVE assigned'));
      } catch { cves.set(id, 'CVE lookup unavailable'); }
    }
  }
  const files = await client.list(`${client.prefix}/pulls/${pr.number}/files`, 1);
  const marker = AUTOFIX_MARKER.exec(pr.body || '');
  const target = marker ? Number(marker[1]) : null;
  const exactScan = branchVerified || mergeVerified;
  const checksPassed = ['CI', 'CodeQL'].every((name) => runs.get(name)?.conclusion === 'success');
  const resolved = target && exactScan && !alerts.unavailable && !alerts.truncated && checksPassed && !alerts.items.some((alert) => alert.number === target);
  const lines = [REPORT_MARKER, '## 資安弱點與修復驗證報告 (Security findings and remediation evidence)', '',
    `當前 PR Head Commit：**${sha}**`,
    `比對基準分支 (Base)：**${safeText(pr.base.ref)}**。本報告由 GitHub API 即時數據生成，絕非 AI 宣稱之虛擬結果。`, '',
    '### 程式碼安全性掃描發現 (CodeQL Findings)',
    `CodeQL 分析範圍：${safeText(chosenRef)}。當前 Head 之 JavaScript/TypeScript 分析證據：**${exactScan ? '已觀測到 (observed)' : '待處理／無法取得 (pending / unavailable)'}**。`,
    alerts.unavailable || (alerts.items.length ? `在此 Ref 觀測到 ${alerts.items.length} 個未解決的 Alert；最多顯示 30 筆。` : '此 Ref 未回傳未解決的 Alert。除非已觀測到當前 Head 的分析證據，否則不代表完全乾淨。'),
    '| Alert | 規則 (Rule) | 嚴重度 (Severity) | CWE | 檔案位置 (Location) |', '|---|---|---|---|---|',
    ...codeRows(client.repository, alerts.items.slice(0, 30)), '',
    '### 本 PR 的相依套件變更 (Dependency changes in this PR)',
    dependencyDiff.unavailable || `回傳 ${dependencyDiff.items.length} 筆相依套件變更；最多顯示 20 筆。下方 GHSA 識別碼來自相依圖比對 API；無 CVE 則不額外編造。`,
    '| 套件名稱 (Package) | 變更類型 (Change) | 版本 (Version) | 授權 (License) | Advisory GHSA IDs | 公開諮詢 CVE 查詢 |', '|---|---|---|---|---|---|',
    ...dependencyDiff.items.slice(0, 20).map((item) => {
      const ids = (item.vulnerabilities || []).map((entry) => entry.advisory_ghsa_id).filter(Boolean);
      return `| ${safeText(item.name)} | ${safeText(item.change_type)} | ${safeText(item.version)} | ${safeText(item.license)} | ${safeText(ids.join(', ') || 'None supplied')} | ${safeText(ids.map((id) => cves.get(id) || 'Not looked up (limit 10)').join(', ') || 'Not applicable')} |`;
    }), '',
    '### 相依套件漏洞清單 (Repository 層級 Dependabot 警報 - repository-level Dependabot alerts)',
    '**此處為 Repository 預設分支的 Dependabot 存量 Alert，不一定由本 PR 引入或修復。** PR 本身的套件差異由 Dependency Review 獨立檢查。',
    dependencies.unavailable || `共回傳 ${dependencies.items.length} 個未解決的相依套件 Alert；最多顯示 20 筆。`,
    '| Alert | 套件名稱 | GHSA | CVE | 嚴重度 | 受影響版本區間 | 首個修復版本 |', '|---|---|---|---|---|---|---|',
    ...dependencyRows(client.repository, dependencies.items.slice(0, 20)), '',
    '### 變更內容摘要 (Proposed changes)',
    ...(marker ? [`由 GitHub Copilot Autofix 針對 [Alert #${target}](${githubUrl(client.repository, `security/code-scanning/${target}`)}) 自動產生修補；原始分析之 Commit: ${marker[2]}.`] : ['本 PR 未包含 Autofix 標籤，非 AI 自動生成。']),
    ...files.items.slice(0, 30).map((file) => `- ${safeText(file.filename)}: ${safeText(file.status)}, +${Number(file.additions) || 0}/−${Number(file.deletions) || 0}. 請點開「Files changed」檢視修復邏輯。`), '',
    '### 當前 PR Head 驗證狀態 (Verification for this PR head)',
    '系統優先以明確派發的 workflow_dispatch 驗證為準。PR 原生觸發之 Actions 依專案權限可能需要人工核准，本報告不繞過該安全要求。',
    ...((runsResponse.workflow_runs || []).some((item) => item.head_sha === sha && item.conclusion === 'action_required')
      ? ['**注意：至少有一個 PR 觸發的 Workflow 正等待人工核准執行。** 請在核准 Actions 執行前檢視程式碼。'] : []),
    ...['CI', 'CodeQL'].map((name) => {
      const run = runs.get(name);
      return run ? `- ${name}: **${safeText(run.conclusion || run.status)}** — [檢視執行紀錄 ${run.id}](${githubUrl(client.repository, `actions/runs/${run.id}`)})` : `- ${name}: **待執行 (pending) — 尚未找到對應此 Head SHA 之執行紀錄**。`;
    }),
    marker ? (resolved
      ? `- 目標 Alert #${target}：**在當前分析的 Ref 中已不再回報，且 CI 與 CodeQL 均驗證成功 (no longer reported on the current analyzed ref, with CI and CodeQL successful)。** 此為針對此目標之修復證據，不代表全專案弱點皆已清除。`
      : `- 目標 Alert #${target}：**已提出修補，但驗證尚未完成或弱點仍然存在 (repair proposed; verification incomplete or the finding remains open)。**`) : '- 本 PR 未宣稱任何自動化修復結果。',
    '', '### 人工審查與決策提示 (Human decision)',
    '- 請審閱 Patch 內容、相關漏洞諮詢（Advisory/CWE）以及剩餘發現。',
    '- 在標記為 Ready 以及 Approve / Merge 之前，請確認所有必要檢查均針對當前 Head 通過。',
    '- 本流程不執行任何自動核准、自動合併、直接部署或繞過安全防護之操作。',
    '- 本報告已刻意過濾並排除任何真實機敏資訊、Token、Secret Scanning 具體值與原始碼敏感片段。'
  ];
  if (alerts.truncated || dependencies.truncated || dependencyDiff.truncated || files.truncated || (runsResponse.total_count || 0) > 100) lines.push('', '**Coverage limit:** one or more API lists were truncated. This report is not exhaustive.');
  return lines.join('\n').slice(0, 60000);
}

async function runReport({ client, event }) {
  const workflow = event.workflow_run?.name === 'CodeQL' ? 'codeql.yml' : event.workflow_run?.name === 'CI' ? 'ci.yml' : null;
  if (!workflow) return ['Skipped unrelated workflow.'];
  const context = await trustedRun(client, event, workflow);
  if (!context || !['push', 'pull_request', 'workflow_dispatch'].includes(context.run.event)) return ['Skipped untrusted or unsupported run.'];
  const { run, repository } = context;
  const associated = await client.list(`${client.prefix}/commits/${run.head_sha}/pulls`, 1);
  if (associated.truncated) return ['Skipped: associated PR list is truncated.'];
  const candidates = associated.items.filter((pr) => pr.state === 'open' && pr.head?.repo?.id === repository.id && pr.head?.sha === run.head_sha && ['main', 'solution/hardened'].includes(pr.base?.ref));
  const notes = [];
  for (const item of candidates.slice(0, 5)) {
    const pr = await client.request('GET', `${client.prefix}/pulls/${item.number}`);
    if (pr.state !== 'open' || pr.head?.sha !== run.head_sha || pr.head.repo.id !== repository.id) continue;
    const body = await buildReport(client, pr);
    const comments = await client.list(`${client.prefix}/issues/${pr.number}/comments`);
    if (comments.truncated) { notes.push(`PR #${pr.number}: comments truncated; skipped rather than risk duplicate reports.`); continue; }
    const existing = comments.items.find((comment) => comment.user?.login === 'github-actions[bot]' && String(comment.body).startsWith(REPORT_MARKER));
    // Re-check before mutation so an old run cannot report itself as validation of a newer commit.
    const current = await client.request('GET', `${client.prefix}/pulls/${pr.number}`);
    if (current.head.sha !== run.head_sha || current.state !== 'open') { notes.push(`PR #${pr.number}: head changed; skipped stale report.`); continue; }
    if (existing && Number.isSafeInteger(existing.id)) await client.request('PATCH', `${client.prefix}/issues/comments/${existing.id}`, { body });
    else await client.request('POST', `${client.prefix}/issues/${pr.number}/comments`, { body });
    notes.push(`Updated evidence report on PR #${pr.number}.`);
  }
  if (candidates.length > 5) notes.push('Only the first five matching open PRs were processed.');
  return notes.length ? notes : ['No matching current-head, same-repository open PR; nothing to report.'];
}
async function main() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const client = createClient({ token: process.env.GH_TOKEN, repository: process.env.GITHUB_REPOSITORY });
  const notes = await runReport({ client, event });
  const text = `## Security report\n\n${notes.map((note) => `- ${note}`).join('\n')}\n`;
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
}
if (require.main === module) main().catch((error) => { console.error(error instanceof GitHubError ? error.message : 'Security report failed; no findings or remediation success are implied.'); process.exitCode = 1; });
module.exports = { buildReport, runReport, latestRuns };
