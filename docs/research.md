# BingoBlitz — 技術研究與查證紀錄 (research.md)

> 本檔記錄 [`plan.md`](plan.md) 各項技術決策的**依據來源**，以及實作時**必須自行重新查證**的項目。
> 目的：讓接手實作的人知道「哪些是查證過的事實、哪些是工程判斷、哪些還沒確認」。
>
> **查證日期：2026-09-10** ／ 來源：GitHub 官方文件（docs.github.com）
>
> ⚠️ GitHub 的安全功能演進很快，產品名稱與 Action 版本都變動過。
> **超過 3 個月未更新時，請重新查證標記為 🔄 的項目。**

## 圖例

| 標記 | 意義 |
|---|---|
| ✅ | 已查證官方文件，可直接採用 |
| 🔄 | 已查證，但會隨時間變動，實作前需重新確認 |
| 🧭 | 工程判斷，未經外部查證，可依實際情況調整 |
| ❓ | 未查證，實作時必須確認 |

---

## R-01 ✅ GitHub Advanced Security 的產品結構

**結論**：GHAS 已拆分為兩個可獨立採購的產品。

- **GitHub Secret Protection** — 偵測機敏資訊洩漏（secret scanning、push protection、validity checks、custom patterns）
- **GitHub Code Security** — 找出程式碼弱點（code scanning／CodeQL、Dependabot、dependency review）

兩者對 GitHub Team 與 GitHub Enterprise Cloud 組織開放。組織的 Security Configuration 中可分別選擇要納入哪一組功能；**官方文件明確指出「可用設定會依你使用的是舊版 GHAS 產品還是新的分離式產品而不同」**——這代表客戶端可能還在舊授權模型上。

**對本專案的影響**：
- 報價與話術必須依新結構分開講，不能再籠統說「GHAS」。
- **T-001 必須先確認客戶／我方組織是哪一種授權模型**，否則 Demo 中看到的設定畫面會和客戶自己的環境對不上，反而扣分。

**來源**：
- `docs.github.com/en/code-security/concepts/security-at-scale/organization-security`
- `docs.github.com/en/code-security/securing-your-organization/enabling-security-features-in-your-organization/creating-a-custom-security-configuration`
- `docs.github.com/en/code-security/tutorials/trialing-github-advanced-security`（GHAS 試用涵蓋這兩大支柱）

---

## R-02 ✅ Copilot Autofix 與「指派 Copilot 修 Alert」

**結論**：這是 Demo 中最強的兩張牌，且能力比一般認知的更強。

1. **Copilot Autofix**：為 code scanning alert 自動產生修復建議。**公開 repo 預設就有**——這點對「先讓客戶自己試」的推廣策略很有用。
2. **指派 Copilot 修 alert**：可從 alert 詳情頁直接把單一 alert 指派給 Copilot。
3. **批次指派**：從 code scanning backlog 或 **security campaign** 中，**一次最多勾選 25 個 alert** 指派給 Copilot，Copilot 會在**單一 PR** 中一併處理。
4. **API 自動化**：可透過 REST API 把 alert 指派給 `copilot-swe-agent[bot]`。

**對本專案的影響**：
- Act 3 的高潮橋段確立為「一次勾 25 個 alert 丟給 Copilot，它開一個 PR 回來」。這是整場 Demo 數字感最強的畫面。
- `plan.md` 第 16 節把「CodeQL alert ≥ 20」設為 DoD，就是為了讓這個批次畫面有足夠的量體撐場。
- **T-407 必須實測並錄下 Autofix 的實際產出**——因為它每次結果可能不同（見 `plan.md` R5）。

**來源**：
- `docs.github.com/en/code-security/getting-started/github-security-features`
- `docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-code-scanning-alerts/resolve-alerts`
- `docs.github.com/en/code-security/tutorials/secure-your-organization/prioritize-alerts-in-production-code`

---

## R-03 🔄 CodeQL Workflow 設定

**結論**（實作時直接照抄，但版本號需確認）：

| 項目 | 查證結果 |
|---|---|
| Action 版本 | `github/codeql-action/init@v4`、`github/codeql-action/analyze@v4` 🔄 |
| JS/TS 語言識別碼 | **`javascript-typescript`**（單一識別碼，不是分開的 `javascript` 與 `typescript`） |
| 其他語言識別碼 | `python`、`actions`、`csharp`、`java-kotlin`、`c-cpp`、`go`、`ruby`、`swift` |
| 必要權限 | `security-events: write`、`actions: read`、`contents: read` |
| 多語言做法 | `strategy.matrix.language` + `fail-fast: false` |
| Query suite 指定 | `queries: security-extended`（或 `security-and-quality`） |
| 設定檔 | `config-file: ./.github/codeql/codeql-config.yml` |
| 合併設定檔與 workflow 設定 | 在 `queries`／`packs` 值前加 `+` 前綴 |
| 範圍限縮 | 設定檔中的 `paths` / `paths-ignore` |
| 內嵌設定 | 可用 `config:` 直接寫 YAML 字串，支援 `disable-default-queries`、`threat-models`、`query-filters` |

**內嵌設定的範例形式**（官方文件）：

```yaml
- uses: github/codeql-action/init@v4
  with:
    languages: ${{ matrix.language }}
    config: |
      disable-default-queries: true
      threat-models: local
      queries:
        - uses: security-extended
      query-filters:
        - exclude:
            tags: /cwe-020/
```

**對本專案的影響**：
- `plan.md` 13.1 的 workflow 已依此撰寫。
- **`query-filters` 這個機制值得在 Act 3 對進階客戶展示**——「你可以精準控制要看哪些類別的弱點，不會被雜訊淹沒」是資安主管很在意的點。
- `threat-models: local` 可放寬 taint source 定義，若某些弱點掃不出來，這是可以嘗試的調整方向（T-406 的備案）。

**來源**：
- `docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options`
- `docs.github.com/en/code-security/reference/code-scanning/troubleshoot-analysis-errors/some-languages-not-analyzed`

---

## R-04 🔄 Dependency Review Action 設定

**結論**：`actions/dependency-review-action@v4`，可用參數如下（全部查證自官方文件）：

| 參數 | 說明 | 本專案用法 |
|---|---|---|
| `fail-on-severity` | `critical` / `high` / `moderate` / `low` | 用 `moderate`，確保 Demo PR 一定被擋 |
| `deny-licenses` | SPDX 授權識別碼清單，命中就擋 | `LGPL-2.0, LGPL-3.0, AGPL-3.0` |
| `allow-licenses` | 白名單模式（**與 `deny-licenses` 二擇一，不能同時用**） | 不使用 |
| `allow-ghsas` | 略過指定的 GHSA ID | 不使用（我們要它全部報出來） |
| `fail-on-scopes` | `development` / `runtime` / `unknown` | 預設 |
| `comment-summary-in-pr` | 在 PR 留下摘要留言 | `always`（Demo 需要看得見的留言） |

也可改用**外部設定檔**，把上述選項寫在獨立 YAML 中——若要對客戶展示「policy as code」的治理概念，這個做法更有說服力。

**注意**：官方範例中 checkout 用到 `actions/checkout@v6` 🔄，與本專案 `plan.md` 中寫的 `@v4` 不同。**T-409 實作時以當下官方文件為準**；另外 INF-04 刻意要用浮動 tag（不 pin SHA）作為反例，這與版本號選擇是兩件事，不要混淆。

**來源**：
- `docs.github.com/en/code-security/tutorials/secure-your-dependencies/customize-dependency-review-action`
- `docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-dependency-review-action`

---

## R-05 ✅ 自訂 Secret Scanning Pattern

**結論**：

- 自訂 pattern 用**正規表達式**定義，可設在 **enterprise / organization / repository** 三個層級。
- 可對自訂 pattern 單獨啟用 **push protection**。
- **重要限制**：要在 repo 層級對某個自訂 pattern 啟用 push protection，**必須先在該 repo 內定義並測試過這個 pattern**。
- 流程是「先 dry run 反覆調整 → 確認無誤報後 publish → 才開始掃描」。
- GitHub 提供**用 AI 產生正規表達式**的功能——這本身就是一個可以順帶展示的 Copilot 賣點。
- pattern 設定頁面會提供數據，協助管理者判斷是否適合開 push protection（誤報率高的 pattern 開了會擋到正常開發）。

**對本專案的影響**：
- **T-404 必須嚴格照「dry run → 驗證 → publish → 開 push protection」的順序**，不可跳步（`plan.md` R7）。
- Act 1 可以順手演一下「用 AI 產生 regex」——這在客戶心中是意外的加分，因為多數人不知道有這功能。

**來源**：
- `docs.github.com/en/code-security/concepts/secret-security/custom-patterns`
- `docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/manage-custom-patterns`
- `docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/generating-regular-expressions-for-custom-patterns-with-ai`

---

## R-06 ✅ Secret Scanning 的能力邊界（Demo 話術必須誠實）

**查證到的限制**（**這些是客戶一定會問的，事先準備好答案比被問倒好**）：

1. **AI 偵測的通用密碼（generic passwords）不支援 push protection，也不支援 validity check。**
   → 對本專案的影響：**SEC-10（docker-compose 中的 DB 密碼）只會產生 alert，不會被 push 擋下**。主持稿必須寫清楚這個差異，不要誤導客戶以為「什麼都擋得住」。

2. **偵測能力取決於 pattern 配對、token 類型，以及該 repo 是否啟用 push protection。**
   → 合作夥伴格式（Azure、AWS、GitHub PAT 等）的偵測率最高；自訂格式需自行定義 pattern。

3. **可用 `paths-ignore` 排除目錄**（例如 `docs/**`、`foo/bar/*.js`）。
   → 對本專案的影響：**務必確認 `docs/` 沒有被排除**，否則 `VULN-CATALOG.md` 中若引用了 secret 片段會掃不到；反過來說，如果我們想避免文件中的範例造成雜訊，這正是該用的工具。

4. **Security Configuration 中可設定 push protection 的 bypass 權限，以及禁止直接 dismiss alert。**
   → 這對應 `plan.md` S8 的橋段（繞過申請與稽核），是治理面很有說服力的一段。

5. 合作夥伴回報 token 有效性的機制存在（`token_raw` / `token_hash` + `label: true_positive|false_positive`）。
   → 這解釋了 validity check 背後的運作方式，對技術型客戶可以多講兩句。

**來源**：
- `docs.github.com/en/code-security/reference/secret-security/supported-secret-scanning-patterns`
- `docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/exclude-folders-and-files`
- `docs.github.com/en/code-security/tutorials/secret-scanning-partner-program`

---

## R-07 ❓ 相依套件版本與 Advisory（**實作時必須自行查證**）

**狀態：未查證，且刻意不在計畫中寫死版本號。**

`plan.md` 12.6 列出了要降版的套件（`lodash`、`minimist`、`jsonwebtoken`、`axios`、`ws`、`node-serialize`、`express`、`PyYAML`、`requests`、`Jinja2`、`lxml`），但**沒有指定版本號**。原因：

- GitHub Advisory Database 持續新增與修訂 advisory，也會調整嚴重度分級。
- 憑記憶或憑舊文章寫的版本號，很可能在實作當下已經不再觸發 alert，或嚴重度已被下修。

**T-307 的實作步驟**：

1. 到 `github.com/advisories` 逐一搜尋套件名稱。
2. 篩選出 **Critical 或 High** 的 advisory（`plan.md` 第 16 節要求 ≥ 2 個 Critical）。
3. 選一個**該 advisory 影響範圍內、但應用程式仍能正常運作**的版本。
4. 釘住該版本，並把 **GHSA ID 記錄到 `docs/VULN-CATALOG.md`**。
5. 安裝後**實測遊戲仍能玩完一局**（降版不能把遊戲弄壞）。

**長期維護**：`plan.md` R11 與 T-703 要求每週跑 `verify-alerts.sh`，就是為了在 advisory 變動導致 alert 數量下降時及早發現。

---

## R-08 ✅ Security Campaigns

**結論**：Security campaign 是「大規模修復管理」的機制，可搭配 Copilot Autofix 一起用來推動修復。Dependabot 則走自動修復 PR 的路線。

**對本專案的影響**：Act 3 的敘事線確立為——
「存量弱點 40+（Security Overview）→ 開一個 campaign 聚焦注入類 → 批次指派 Copilot（R-02 的 25 個上限）→ 追蹤修復進度」。
這條線把「看得到」「修得動」「追得到」三件事串起來，正是 CISO 買單的邏輯。

**來源**：`docs.github.com/en/code-security/tutorials/secure-your-organization/prioritize-alerts-in-production-code`

---

## R-09 🧭 技術選型（工程判斷，未經外部查證）

以下選擇是基於 Demo 需求的工程判斷，**沒有查證外部文件**，可依團隊熟悉度調整：

| 決策 | 理由 | 可替換方案 |
|---|---|---|
| Socket.IO 而非原生 WebSocket | 自動重連、房間（room）概念內建、Redis adapter 可水平擴展；重連能力對現場 Demo 的穩定性很重要 | 原生 `ws`、Azure Web PubSub SDK |
| Python FastAPI 作為第二語言 | 只是為了展示 CodeQL 多語言掃描；FastAPI 開發快、樣板少 | Java Spring Boot（若客戶是 Java 大戶，改用這個更有共鳴） |
| PostgreSQL 而非 MongoDB | SQL Injection 是最經典、最好懂的弱點示範，需要真的 SQL | — |
| 賓果卡用標準 B-I-N-G-O 75 球規則 | 客戶一看就懂，不需解釋規則 | 90 球歐式規則 |
| 前端 React 而非 Vue/Svelte | `dangerouslySetInnerHTML` 是 CodeQL 對 React XSS 的經典 sink，示範效果明確 | Vue（`v-html` 亦可） |
| Vitest + pytest + Playwright | Copilot 產生測試的橋段需要測試框架已就位 | Jest |

---

## R-10 🧭 Demo 現場的工程風險（來自經驗判斷）

1. **CodeQL 掃描時間**：本專案規模下，完整掃描預估數分鐘。Demo 現場不宜等待。
   → 對策：事先跑完，現場展示既有 alert；若一定要現場觸發，用 `paths` 限縮到單一資料夾（`plan.md` R4）。

2. **Autofix 產出不穩定**：LLM 產出本質上有變異。
   → 對策：T-407 錄下實際輸出；準備「AI 給的是建議、人仍需審核」的話術。**這一點誠實講反而加分**，因為客戶最怕的就是被賣一個「全自動」的幻覺。

3. **Push Protection 的偵測依賴 pattern 格式**：不是所有看起來像 key 的字串都會被擋。
   → 對策：T-405 連續實測 3 次；只把**實測會被擋**的 pattern 寫進主持稿（`plan.md` R7）。

4. **降版套件可能讓應用程式壞掉**：例如 `express` 或 `ws` 的舊版與新版 Node 不相容。
   → 對策：T-307 的 DoD 明確要求「安裝後遊戲仍能正常運作」。

---

## R-11 ❓ 待實作時確認的開放問題

這些問題現在無法回答，但會影響實作細節。**遇到時先問，不要自己發明**（`tasks.md` 附錄第 6 條）：

| # | 問題 | 何時需要答案 | 影響 |
|---|---|---|---|
| ~~Q1~~ | ~~組織是舊版 GHAS 授權還是新的分離式產品？~~ | ~~T-001~~ | ✅ **2026-09-10 已答：沒有組織**。個人帳號，無組織層級權限。見 R-12 |
| Q2 | Copilot 授權是 Business 還是 Enterprise？ | T-001 | 決定 Code Review 與 Coding Agent 能否演（Act 2 的核心） |
| ~~Q3~~ | ~~Repo 要 Public 還是 Internal？~~ | ~~T-002~~ | ✅ **2026-09-10 已答：Public**。判定無機密性；換得免費的 CodeQL／Autofix／Dependabot。見 R-12 |
| Q4 | 有無 Azure 訂閱？ | T-003 | 決定是否全面採用 Mock 模式 |
| Q5 | 目標客戶產業？ | T-004 | 決定要不要做產業客製換皮 |
| Q6 | `security` 與 `security-extended` 兩個 suite 的實際 alert 數量差多少？ | T-406 | 差異本身是 Demo 素材；也決定要不要用 `threat-models: local` |
| Q7 | 自訂 pattern 的誤報率是否低到可以開 push protection？ | T-404 | 誤報高就不能開，S3 橋段要改寫 |
| Q8 | Copilot Coding Agent 對 25 個 alert 的實際處理品質如何？ | T-407 | 若品質不佳，Act 3 高潮要換成別的橋段 |

---

## R-12 🚧 環境限制：無組織層級權限（2026-09-10）

**狀態：已確定的環境約束，非待查問題。**

現有帳號**無法取得 GitHub Organization 層級權限**。專案落在個人帳號的公開 repo
`jeff1121/GitHub-Advanced-Security-DEMO`。

### 被擋住的能力

Security Overview（組織儀表板）、Security Configurations、Security Campaign、
Push Protection 的 bypass 稽核設定——這四項都是**組織層級功能**，
而它們正好構成 `plan.md` Act 3 的全部內容，因此 **Act 3 整幕暫緩**。

### 仍然可用的能力

`plan.md` 3.6 節有完整清單。關鍵事實是：

- **Act 1 與 Act 2 完全不受影響**，而整場 Demo 的兩個高潮
  （Push Protection 當場阻擋、Copilot Autofix 一鍵修復）都在這兩幕裡。
- **公開 repo 上 CodeQL、Copilot Autofix、Dependabot 皆免費**（R-02 已查證 Autofix 對公開 repo 預設可用）。
  這反而讓 Phase 4 可以不等 GHAS 授權就先開跑，把驗證時程往前拉。

### 兩個尚未查證、必須實測的邊界

| # | 問題 | 為何不確定 | 驗證任務 |
|---|---|---|---|
| Q9 | 批次指派 25 個 alert 給 Copilot，是否只能從組織層級的 security campaign 進入？ | R-02 引用的官方文件寫「從 code scanning backlog **或** security campaign」批次指派。campaign 已確定不可用；**backlog 這條路徑是不是 repo 層級功能，文件沒說清楚** | T-407 |
| Q10 | 公開 repo 使用**自訂 secret scanning pattern** 是否需要 Secret Protection 授權？ | R-05 已查證自訂 pattern 可設在 repo 層級，但**授權門檻未查證**。公開 repo 的基本 secret scanning 免費，不代表自訂 pattern 也免費 | T-404 |

**兩者都有備案**（見 `plan.md` 3.6 節），所以不構成阻斷，但實測結果會改變主持稿寫法，
因此必須在 Phase 5 撰寫主持稿**之前**完成驗證。

### 解封條件

把 repo 轉移到 GitHub Organization。`plan.md` 中標記 🚧 的段落都保留了完整規格，
屆時直接啟用即可，不需要重新設計。

---

## 附錄：查證方法備忘

本次研究透過 Context7 MCP 查詢 GitHub 官方文件（`/websites/github_en_code-security`）。後續重新查證時：

1. 優先查官方文件，不要依賴部落格文章或訓練資料記憶——GitHub 安全功能的產品名稱與 Action 版本變動頻繁。
2. 特別注意標記 🔄 的項目：Action 版本號、產品命名、語言識別碼。
3. 標記 ❓ 的項目（R-07、R-11）**一定要在實作當下查**，不可沿用本文件的推測。
