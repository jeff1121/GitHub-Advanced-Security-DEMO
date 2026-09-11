# BingoBlitz — GitHub Advanced Security & Copilot Live Demo 操作小抄

> **狀態：已實測驗證就緒 (Ready for Demo)**  
> 本專案已在 GitHub 上配置並驗證完成：CI/CD Pipeline、CodeQL 多語言掃描、Secret Scanning / Push Protection、Dependency Review、Dependabot 以及 GitHub Copilot Autofix 自動修復 PR 與完整安全審查報告。

---

## 快速速查：核心展示場景總覽

| 演示階段 | 演示目的 | 操作指令 / 入口 | 核心展示亮點 | 雲端驗證狀態 |
|---|---|---|---|---|
| **Act 1：Push Protection** | 展示「工程師不慎將 Key 寫進程式碼，Push 當場被拒絕」 | `git checkout demo/act1-leak-key`<br>`bash scripts/plant-secret.sh --apply`<br>`git commit -am "..."`<br>`git push origin demo/act1-leak-key` | ⭐ **GitHub 當場噴出紅字 `GH013 / GITHUB PUSH PROTECTION` 拒絕推送**！完全無法進版控。 | ✅ 實測連續 3 次精準阻擋 |
| **Act 2：PR 門禁與多重掃描** | 展示「PR 上的自動化安全門禁：CodeQL、Dependency Review」 | 觀察或建立 PR：<br>**`demo/act2-new-feature` ➔ `main`**<br>[PR #27 連結](https://github.com/jeff1121/GitHub-Advanced-Security-DEMO/pull/27) | ⭐ **CodeQL 抓到 Reflected XSS (CWE-79)**<br>⭐ **Dependency Review 當場抓到 CVE-2021-44906 (Critical 原型鏈污染)** 並標示阻擋！<br>⭐ **PR 自動留言完整安全報告**，包含 CWE、CVE、GHSA 對照表。 | ✅ PR #27 已產生即時報告 |
| **Act 3：AI 自動修復與開 PR** | 展示「CodeQL 發現弱點後，GitHub Copilot Autofix 一鍵修補並開 PR 等待審查」 | 觀察由 Autofix API 自動產生的 PR：<br>**[PR #28 連結](https://github.com/jeff1121/GitHub-Advanced-Security-DEMO/pull/28)** | ⭐ **AI 自動產出參數化 SQL 修復程式碼**<br>⭐ **自動派送 CI 與 CodeQL 重新驗證**（全綠通過）<br>⭐ **安全報告明確標註：Target Alert #7 已成功消除**！<br>⭐ 專案管理者只需進行 Code Review 並點擊 Approve Merge。 | ✅ PR #28 已生成且驗證通過 |
| **收尾：標準解答與安全對照** | 「那完全符合最佳實踐的修復版長怎樣？」 | 切換至 **`solution/hardened`** 分支 | 完整參數化查詢、路徑遍歷防護、安全 Session 與 CSPRNG 抽號。 | ✅ 程式庫與測試全數通過 |
| **重置機制** | Demo 完畢後一鍵恢復到基準狀態 | `bash scripts/reset-demo.sh --apply` | 非破壞性還原指定演示檔案並生成新 Session 標記，可重複演示。 | ✅ 測試通過 |

---

## 現場實機展示操作步驟（Step-by-Step）

### 場景一：Push Protection 當場阻擋金鑰推送（2 分鐘）

1. **切換到準備好的無秘密起點分支**：
   ```bash
   git checkout demo/act1-leak-key
   ```
2. **植入由本機亂數產生的合成 Azure 金鑰**（不讀取任何真實憑證）：
   ```bash
   bash scripts/plant-secret.sh --apply
   ```
3. **提交並嘗試推送**：
   ```bash
   git add demo-fixtures/azure-sample.ts
   git commit -m "demo: test reviewed synthetic Azure token detection"
   git push origin demo/act1-leak-key
   ```
4. **展示畫面**：
   終端機當場被 GitHub 拒絕：
   ```text
   remote: error: GH013: Repository rule violations found for refs/heads/demo/act1-leak-key.
   remote: - GITHUB PUSH PROTECTION
   remote:     - Push cannot contain secrets
   remote:       —— Azure Storage Account Access Key ——————————————————
   remote:        locations:
   remote:          - commit: ... path: demo-fixtures/azure-sample.ts:4
   ```
   👉 **亮點說明**：「根本不需要等到 CI/CD 或上線前才掃描，在開發者 `git push` 的第一秒就被攔在外面！」

---

### 場景二：PR 安全門禁與自動安全報告（3 分鐘）

1. **在 GitHub 網頁開啟 [PR #27](https://github.com/jeff1121/GitHub-Advanced-Security-DEMO/pull/27)**（`demo/act2-new-feature` ➔ `main`）。
2. **展示 Checks 檢查結果**：
   - **CodeQL**：成功掃描出 JavaScript 程式碼中的 **Reflected XSS (CWE-79)**。
   - **Dependency Review**：當場標記失敗，紅字抓出 PR 新增的 `minimist@1.2.5` 含有 **CVE-2021-44906（Critical 原型鏈污染漏洞）**！
3. **展示 PR 留言區的即時安全報告**：
   - 看到 GitHub Actions Bot 自動產生的 Markdown 報告：
     - **CodeQL 弱點**：Alert 編號、規則名稱、CWE 分類、檔案與行號。
     - **相依套件差異**：套件名稱、變更版本、授權類型、GHSA 編號以及 **CVE 編號**。
   👉 **亮點說明**：「PR 不只是比對程式碼，而是自動產出資安評估報告，有高危險 CVE 或漏洞直接阻擋合併。」

---

### 場景三：Copilot Autofix 自動修復與 AI 開 PR（3 分鐘）

1. **在 GitHub 網頁開啟 [PR #28](https://github.com/jeff1121/GitHub-Advanced-Security-DEMO/pull/28)**。
2. **展示 PR 內容**：
   - PR 標題：`fix: Copilot Autofix for js/sql-injection (#7)`
   - PR 說明：清楚描述發現了 CodeQL Alert #7（SQL Injection，CWE-89），並自動說明修復方案為改用參數化查詢（`ILIKE '%' || $1 || '%'`）。
   - **Files changed**：點開查看 Diff，AI 自動修改了 `scripts/scan-demo.cjs`，安全地綁定參數，未更動其他無關檔案。
3. **展示自動驗證結果**：
   - Checks 標籤中，針對此修復 Commit 自動派發的 **CI 與 CodeQL 全部顯示綠燈通過（Success）**！
   - PR 留言區的安全報告確認：**`Target alert #7: no longer reported on the current analyzed ref, with CI and CodeQL successful.`**
4. **人工審核流程**：
   - 點擊 **Files changed** 進行 Code Review。
   - 管理者點擊 **Approve** 並 **Merge pull request**。
   👉 **亮點說明**：「這就是 GitHub Copilot 與 CodeQL 的綜效——從掃描弱點、AI 產生修復 Patch、自動開 PR、到重新驗證修復有效，工程師只需要做最後一步的確認審查！」

---

### 場景四：Demo 結束後一鍵重置（1 分鐘）

在本地執行：
```bash
# 預覽重置變更（Dry-run）
bash scripts/reset-demo.sh

# 正式套用重置（恢復測試展示檔案，並建立新的 Session 追蹤標籤）
bash scripts/reset-demo.sh --apply

# 提交並推送以供下一場 Demo 使用
git add scripts/scan-demo.cjs demo-dependencies/package.json demo-dependencies/package-lock.json docs/demo-session.json
git commit -m "demo: start a fresh security rehearsal"
git push origin main
```
