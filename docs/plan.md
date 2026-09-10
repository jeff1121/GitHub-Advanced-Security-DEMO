# BingoBlitz — GitHub Advanced Security Demo 專案計畫書

> **文件版本**：v2.0 ／ **更新日期**：2026-09-10 ／ **狀態**：待核准後開工
> **專案代號**：BingoBlitz（雲端賓果大亂鬥）
> **本文件是本專案的唯一權威計畫（Single Source of Truth）。**
> 任務拆解見 [`tasks.md`](tasks.md)，技術依據與查證來源見 [`research.md`](research.md)。

> ## ⚠️ 本專案刻意內含資安弱點
> 這是行銷／售前 Live Demo 資產。所有漏洞與機敏資訊洩漏皆為刻意設計，
> 用於展示 GitHub Copilot 與 GitHub Advanced Security 的偵測與修復能力。
> **嚴禁**部署至正式環境或公開位置。詳見 [`SECURITY-DEMO-NOTICE.md`](SECURITY-DEMO-NOTICE.md)。

---

## 目錄

**第一部：策略**
1. [專案目標與定位](#1-專案目標與定位)
2. [為什麼選「線上賓果」](#2-為什麼選線上賓果)
3. [GitHub 能力對照表](#3-github-能力對照表)
4. [Demo 劇本（三幕劇）](#4-demo-劇本三幕劇)

**第二部：實作規格**

5. [技術架構與選型](#5-技術架構與選型)
6. [Repository 結構](#6-repository-結構)
7. [資料模型](#7-資料模型)
8. [REST API 契約](#8-rest-api-契約)
9. [Socket.IO 事件契約](#9-socketio-事件契約)
10. [計分服務契約](#10-計分服務契約)
11. [環境變數與 Mock 模式](#11-環境變數與-mock-模式)
12. [弱點目錄與植入規格](#12-弱點目錄與植入規格)
13. [GitHub 平台設定規格](#13-github-平台設定規格)

**第三部：執行**

14. [分支策略與 Demo 狀態管理](#14-分支策略與-demo-狀態管理)
15. [執行階段與時程](#15-執行階段與時程)
16. [驗收標準 DoD](#16-驗收標準-dod)
17. [風險與對策](#17-風險與對策)
18. [待確認事項](#18-待確認事項)
19. [後續延伸](#19-後續延伸)

---
---

# 第一部：策略

## 1. 專案目標與定位

### 1.1 商業目標

打造一套**可重複執行、可重置、5 分鐘內就能讓客戶「哇」出來**的 Live Demo 資產，讓售前團隊在客戶會議中，用一個真實可玩的應用程式，完整演繹 GitHub Copilot + GitHub Advanced Security 的端到端價值。

### 1.2 目標受眾與訴求

| 受眾 | 最在意的事 | 本 Demo 對應的橋段 |
|---|---|---|
| CISO / 資安主管 | 弱點存量、稽核合規、風險可視化 | Act 3：Security Overview、Security Campaign |
| 開發主管 / Tech Lead | 開發速度 vs. 品質、Code Review 負擔 | Act 2：Copilot Autofix、Copilot Code Review |
| 開發者 | 不想被資安流程拖慢 | Act 1：Push Protection 在推送當下就擋，不用等到上線前 |
| 採購 / IT 決策者 | 工具整合成本、要不要多買一堆 SaaS | 全程只在 GitHub 一個平台完成 |

### 1.3 成功指標

- 每一項要推銷的 GitHub 能力，**至少有一個「必定觸發」的觸點**（不能靠運氣）。
- 全程可在 **60 / 30 / 15 分鐘** 三種長度之間切換。
- 任何業務同仁照著主持稿，**不需要工程背景**也能完成 Demo。
- Demo 結束後 **5 分鐘內可重置**，下一場立即可用。

---

## 2. 為什麼選「線上賓果」

這不只是「好玩」而已。賓果這個題目在技術上天然長出我們要演的每一種弱點，不需要硬塞：

| 賓果的功能需求 | 天然帶出的弱點類型 | 對應 GitHub 能力 |
|---|---|---|
| 多人即時連線（開房、抽號） | WebSocket 授權缺失、競爭條件 | CodeQL、Copilot Code Review |
| 隨機抽號碼 | 弱亂數 → **遊戲可被預測作弊**（現場最有戲劇性） | CodeQL（CWE-338） |
| 玩家頭像上傳 | Path Traversal、SSRF | CodeQL |
| 房間聊天室 | 儲存型 XSS | CodeQL、Copilot Autofix |
| AI 報號主持人（Azure OpenAI） | **API Key 洩漏**（最主打的橋段） | Secret Scanning / Push Protection |
| 排行榜查詢 | SQL Injection、N+1 查詢 | CodeQL、Copilot Code Review |
| 賽後戰報產生 | Command Injection | CodeQL |
| 玩家個資（Email 邀請） | IDOR、敏感資料寫入 Log | CodeQL |

**額外好處**：開場可以請客戶**掃 QR Code 一起玩一局**。當客戶的手機真的在跳號碼、真的有人喊 BINGO 之後，你再說「現在我們來看看這支程式的原始碼」——那個轉折的張力，遠勝任何投影片。

---

## 3. GitHub 能力對照表

> 這張表是整個專案的骨幹。**每一列都必須在 Demo 中被實際觸發過一次**，Phase 4 逐列驗收。
> 產品命名依 2025 年後的新結構：GHAS 已拆分為 **GitHub Secret Protection** 與 **GitHub Code Security** 兩個可獨立採購的產品（見 `research.md` R-01）。

### 3.1 GitHub Secret Protection

| # | 能力 | Demo 觸點 | 主要檔案 | 幕次 |
|---|---|---|---|---|
| S1 | Secret Scanning（存量掃描） | Repo 一啟用就跳出 9+ 個既有 Key 洩漏 | 多處 | Act 1 |
| S2 | **Push Protection**（推送阻擋） | 現場 commit 一個 Azure OpenAI Key，push 當場被擋下 | `apps/api/src/config/azure.ts` | **Act 1 高潮** |
| S3 | 自訂 Pattern | 自訂內部授權 Token 格式 `BINGO_SK_live_[A-Za-z0-9]{32}` | Org 設定 + `apps/api/src/lib/license.ts` | Act 1 |
| S4 | Git 歷史掃描 | 一個已被 `git rm` 但仍在歷史中的 `secrets/prod.json` | Git 歷史 | Act 1 |
| S5 | AI 偵測通用密碼 | 硬編碼的 DB 密碼（非標準格式，靠 AI 抓） | `docker-compose.yml` | Act 1 |
| S6 | Validity Check | 說明 GitHub 會主動向服務商驗證 Token 是否仍有效 | — | Act 1 口述 |
| S7 | 洩漏後的正確做法 | 改用 Azure Key Vault + OIDC 無密碼驗證 | `solution/hardened` 分支 | Act 1 收尾 |
| S8 | 繞過與稽核 | 展示 Push Protection 的 bypass 申請與稽核紀錄 | Org 設定 | Act 1（進階客戶） |

### 3.2 GitHub Code Security（CodeQL）

| # | 能力 | Demo 觸點 | 主要檔案 | 幕次 |
|---|---|---|---|---|
| C1 | Code Scanning 預設設定 | 一鍵啟用，不用寫 YAML | Repo 設定 | Act 2 |
| C2 | Code Scanning 進階設定 | 自訂 workflow、指定 `security-extended` query suite | `.github/workflows/codeql.yml` | Act 2 |
| C3 | 多語言掃描 | 同時掃 `javascript-typescript`、`python`、`actions` | 全 repo | Act 2 |
| C4 | **Copilot Autofix** | SQLi／XSS 一鍵產生修復並提交 | `apps/api/src/routes/rooms.ts` | **Act 2 高潮** |
| C5 | **指派 Copilot 修 Alert** | 一次勾選 25 個 alert 丟給 Copilot Coding Agent，自動開一個 PR | Security 頁籤 | **Act 3 高潮** |
| C6 | Security Campaign | 建立「清除注入類弱點」活動，追蹤修復進度 | Org Security 頁籤 | Act 3 |
| C7 | PR 上的 Code Scanning 檢查 | PR 被 Required Check 擋住無法合併 | Ruleset | Act 2 |
| C8 | 第三方 SARIF 匯入 | 把 Trivy／ESLint 結果匯進同一個 Security 頁籤 | `.github/workflows/sarif-upload.yml` | Act 3 |
| C9 | 自訂 CodeQL 查詢 | 自訂查詢：抓「未經授權的 Socket.IO 事件處理器」 | `.github/codeql/custom-queries/` | Act 3（進階客戶） |

### 3.3 供應鏈安全

| # | 能力 | Demo 觸點 | 主要檔案 | 幕次 |
|---|---|---|---|---|
| D1 | Dependabot Alerts | 10+ 個既有漏洞相依套件，含 ≥2 個 Critical | `package.json` / `requirements.txt` | Act 2 |
| D2 | Dependabot Security Updates | 自動開好的修復 PR | — | Act 2 |
| D3 | Dependabot Version Updates | 定期升版 PR | `.github/dependabot.yml` | Act 3 |
| D4 | Dependency Review Action | PR 中新增高風險套件 → 直接擋 | `.github/workflows/dependency-review.yml` | Act 2 |
| D5 | 授權合規檢查 | 引入 LGPL 套件 → `deny-licenses` 觸發 | 同上 | Act 2 |
| D6 | SBOM 匯出 | 一鍵匯出 SPDX 格式清單 | Repo Insights | Act 3 |
| D7 | Artifact Attestations | 建置產物來源證明 | `.github/workflows/deploy-azure.yml` | Act 3（進階） |

### 3.4 GitHub Copilot

| # | 能力 | Demo 觸點 | 幕次 |
|---|---|---|---|
| P1 | Copilot 程式碼補全 | 現場實作「踢出玩家」功能 | Act 1 |
| P2 | Copilot Chat／Agent Mode | 用自然語言請 Copilot 修好 Path Traversal | Act 2 |
| P3 | **Copilot Code Review** | PR 上自動留意見，抓出 God Function 與缺測試 | **Act 2** |
| P4 | Copilot 自訂指令 | `.github/copilot-instructions.md` 注入團隊安全規範，讓 Copilot 從一開始就寫出安全的程式碼 | Act 1 |
| P5 | Copilot 產生單元測試 | 為賓果連線判定補上測試 | Act 2 |
| P6 | Copilot Coding Agent | 指派 Issue 給 Copilot，它自己開 PR | Act 3 |
| P7 | Copilot PR Summary | 自動摘要 PR 變更 | Act 2 |

### 3.5 平台治理

| # | 能力 | Demo 觸點 | 主要檔案 |
|---|---|---|---|
| G1 | Repository Rulesets | 強制 PR、必要檢查、禁止強制推送 | Repo 設定 |
| G2 | CODEOWNERS | 動到 `infra/` 就必須資安團隊核准 | `.github/CODEOWNERS` |
| G3 | Security Overview | 全組織弱點儀表板、趨勢圖 | Org 層級 |
| G4 | Security Configurations | 一套安全設定套用到全組織 repo | Org 設定 |
| G5 | 私密弱點回報 | 外部研究員回報管道 | Repo 設定 |
| G6 | Actions 權限限縮 | `permissions:` 最小權限原則（對照 INF-06 的反例） | Workflow |
| G7 | Environment 保護規則 | 部署到 Production 需人工核准 | Repo 設定 |

**合計 38 項能力觸點。**

---

## 4. Demo 劇本（三幕劇）

### 4.1 完整版（60 分鐘）

| 時間 | 段落 | 內容 | Wow Moment |
|---|---|---|---|
| 0–5 | **開場暖身** | 請在場所有人掃 QR Code，一起玩一局 BingoBlitz | 客戶自己在玩，會場有笑聲 |
| 5–8 | **設定情境** | 「這是我們團隊做的，兩週後上線。現在我們來看看它的原始碼。」 | 從歡樂轉到嚴肅的落差 |
| 8–20 | **Act 1：左移防護** | Copilot 協助開發「踢出玩家」功能 → 開發者順手把 Azure OpenAI Key 貼進設定檔 → `git push` → **當場被 Push Protection 擋下** → 改用 Key Vault → 順帶展示自訂 Pattern 與歷史洩漏掃描 | ⭐ Push 被擋下的那一刻 |
| 20–38 | **Act 2：PR 品質關卡** | 開 PR → CodeQL 掃出 SQL Injection 與 XSS → **Copilot Autofix 一鍵產生修復** → Copilot Code Review 指出 God Function 與缺少測試 → Dependency Review 擋下含 CVE 的 lodash → Required Check 讓 PR 無法合併 | ⭐ Autofix 直接給出可合併的修補 |
| 38–52 | **Act 3：管理者視角** | Security Overview 看到 40+ 存量弱點 → 建立 Security Campaign「清除注入類弱點」→ **一次勾選 25 個 alert 指派給 Copilot** → Copilot 自動開 PR → Dependabot 自動修復 PR → 組織層級趨勢報表 | ⭐ 一次指派 25 個 alert 給 AI |
| 52–60 | **收尾** | 價值總結、導入路徑、授權說明、Q&A | — |

### 4.2 精簡版（30 分鐘）

開場玩一局（3 分鐘）→ Act 1 只演 Push Protection（7 分鐘）→ Act 2 完整（12 分鐘）→ Security Overview 快閃（5 分鐘）→ Q&A（3 分鐘）。

### 4.3 攤位版（15 分鐘）

只演兩個高潮：**Push Protection 阻擋** + **Copilot Autofix**。省略遊戲互動，直接開 IDE。

### 4.4 主持稿撰寫要求

`docs/DEMO-SCRIPT.md`（Phase 5 產出）需為每個橋段提供：

- **逐字稿**（讓非工程背景的業務也能照唸）
- **操作步驟**（點哪裡、輸入什麼，精確到按鈕名稱）
- **預期畫面**（截圖，供對照）
- **客戶痛點對應句**（例如：「貴公司上個月是不是也有過 Key 外洩的事件？」）
- **常見提問與標準答覆**
- **Plan B**（這一步失敗時怎麼救場）

---
---

# 第二部：實作規格

## 5. 技術架構與選型

### 5.1 技術選型與理由

| 層 | 技術 | 選它的理由（Demo 觀點） |
|---|---|---|
| 前端 | React 19 + Vite + TypeScript + TailwindCSS | 主流、客戶熟悉；TS 讓 CodeQL 有東西可掃 |
| 後端 API | Node.js 20 + Express 4 + Socket.IO 4 | 即時連線；`javascript-typescript` 是 CodeQL 支援度最好的語言之一 |
| 計分服務 | Python 3.12 + FastAPI | **刻意用第二語言**，展示 CodeQL 多語言掃描 |
| 資料庫 | PostgreSQL 16 | SQL Injection 的舞台 |
| 快取 / Pub-Sub | Redis 7 | Socket.IO 水平擴展 |
| 容器 | Docker + docker-compose | 一鍵起本地環境；Dockerfile 本身也是掃描標的 |
| IaC | Bicep + Terraform | 兩份都寫，展示 IaC 弱點掃描 |
| CI/CD | GitHub Actions | Workflow 本身也內含弱點 |
| 測試 | Vitest（JS）+ pytest（Python）+ Playwright（E2E） | Copilot 產生測試的橋段需要測試框架已就位 |

### 5.2 Azure 服務對應

| Azure 服務 | 在遊戲中的用途 | Demo 中扮演的角色 |
|---|---|---|
| **Azure OpenAI** | AI 報號主持人、聊天室髒話過濾 | 主要的 API Key 洩漏標的 |
| **Azure Blob Storage** | 玩家頭像、賽後戰報圖 | Connection String 洩漏 + Path Traversal |
| **Azure Web PubSub** | 即時訊息水平擴展 | Access Key 洩漏 |
| **Azure Communication Services** | Email／SMS 邀請好友 | Key 洩漏 + 簡訊轟炸（缺 Rate Limit） |
| **Azure Database for PostgreSQL** | 主資料庫 | 連線字串洩漏、SQLi |
| **Azure Key Vault** | **正確做法的對照組** | 修復後展示「應該長這樣」 |
| **Azure Container Apps** | 部署目標 | 部署 Workflow 的權限弱點 |
| **Application Insights** | 監控 | 敏感資料寫入 Log 的示範 |

> **實作彈性**：所有 Azure 服務都必須提供 **Mock 模式**（`MOCK_AZURE=true`），現場網路不通或無訂閱時仍可完整 Demo。
> **Key 洩漏的橋段不需要真的連上 Azure 也能演**——Secret Scanning 只看字串格式。

### 5.3 架構圖

```
                       [ 玩家手機 / 瀏覽器 ]
                                |
                      Azure Static Web Apps
                        (apps/web  React 19)
                                |
               +----------------+----------------+
               |                                 |
    Azure Container Apps                  Azure Web PubSub
  (apps/api  Express + Socket.IO) <-----> (即時訊息扇出)
               |
    +----------+----------+------------------+
    |          |          |                  |
PostgreSQL   Redis   Blob Storage      Azure OpenAI
                                             |
                                    (apps/scoring  FastAPI)
```

---

## 6. Repository 結構

```
GitHub-Advanced-Security-DEMO/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # 建置與測試（含 INF-04、INF-06）
│   │   ├── codeql.yml                # CodeQL 進階設定（多語言）
│   │   ├── dependency-review.yml     # PR 相依套件審查
│   │   ├── sarif-upload.yml          # 第三方掃描結果匯入（Trivy／ESLint）
│   │   ├── deploy-azure.yml          # 部署（含 SEC-06、INF-07）
│   │   └── pr-label.yml              # 含 INF-05（pull_request_target 誤用）
│   ├── codeql/
│   │   ├── codeql-config.yml
│   │   └── custom-queries/
│   │       ├── qlpack.yml
│   │       └── unauthorized-socket-handler.ql
│   ├── copilot-instructions.md
│   ├── CODEOWNERS
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── dependabot.yml
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.yml
│       └── demo_feedback.yml
├── apps/
│   ├── web/                          # React 前端
│   │   ├── src/
│   │   │   ├── pages/                # Home, CreateRoom, JoinRoom, GameRoom, Result
│   │   │   ├── components/           # BingoCard, ChatMessage, ShareLink, Leaderboard...
│   │   │   ├── game/                 # checkBingo.ts（FE-05）
│   │   │   ├── lib/                  # auth.ts, socket.ts, embed.ts, api.ts
│   │   │   └── config.ts             # SEC-04
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   ├── api/                          # Express + Socket.IO 後端
│   │   ├── src/
│   │   │   ├── app.ts                # BE-12, FE-07
│   │   │   ├── server.ts
│   │   │   ├── config/azure.ts       # SEC-01
│   │   │   ├── routes/               # auth, rooms, players, avatar, cardset,
│   │   │   │                         # invite, leaderboard, report, debug
│   │   │   ├── sockets/              # handlers.ts（AZ-04）, registry.ts（CQ-07）
│   │   │   ├── game/                 # engine.ts（CQ-01, BE-15）, drawer.ts（BE-06）
│   │   │   ├── services/             # storage.ts, openai.ts, notify.ts, report.ts
│   │   │   ├── lib/                  # jwt.ts, hash.ts, license.ts, db.ts
│   │   │   ├── middleware/           # logger.ts（BE-11）, auth.ts
│   │   │   ├── validators/           # nickname.ts（BE-08）
│   │   │   └── utils/                # merge.ts（BE-13）
│   │   ├── tests/
│   │   │   └── fixtures/notify.json  # SEC-07
│   │   ├── db/migrations/
│   │   ├── Dockerfile                # INF-01
│   │   └── package.json
│   └── scoring/                      # Python FastAPI 計分服務
│       ├── app/
│       │   ├── main.py
│       │   ├── verify.py
│       │   ├── importer.py           # BE-05
│       │   └── xml_import.py         # BE-10
│       ├── tests/
│       ├── Dockerfile
│       └── requirements.txt
├── packages/
│   └── shared/                       # 共用型別與常數（TS）
├── infra/
│   ├── bicep/
│   │   ├── main.bicep
│   │   └── storage.bicep             # INF-02
│   └── terraform/
│       ├── main.tf                   # SEC-03
│       └── network.tf                # INF-03
├── docs/
│   ├── plan.md                       # 本文件（權威計畫）
│   ├── tasks.md                      # 任務拆解
│   ├── research.md                   # 技術研究與查證來源
│   ├── VULN-CATALOG.md               # 弱點對照詳細版（含修復解答）
│   ├── DEMO-SCRIPT.md                # 主持稿逐字稿
│   ├── GHAS-SETUP.md                 # GitHub 設定步驟清單
│   ├── AZURE-SETUP.md                # Azure 資源佈建步驟
│   └── SECURITY-DEMO-NOTICE.md       # 免責聲明
├── scripts/
│   ├── reset-demo.sh                 # 一鍵重置到基準狀態
│   ├── seed.sh                       # 灌入假資料
│   ├── plant-secret.sh               # Act 1 現場植入 Key 的輔助腳本
│   └── verify-alerts.sh              # 驗證所有預期 alert 都出現了
├── docker-compose.yml                # SEC-10
├── .env.example
├── .gitignore                        # SEC-11（刻意缺漏 .env）
├── README.md
└── LICENSE
```

---

## 7. 資料模型

PostgreSQL。Migration 放 `apps/api/db/migrations/`，用 node-pg-migrate 或純 SQL 檔皆可。

```sql
-- 玩家
CREATE TABLE players (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname      TEXT NOT NULL,
  email         TEXT,                 -- AZ-01 IDOR 洩漏標的
  phone         TEXT,                 -- AZ-01 IDOR 洩漏標的
  avatar_path   TEXT,
  password_hash TEXT,                 -- BE-07 用 MD5 存
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,  -- AZ-02 大量賦值標的
  last_ip       TEXT,                 -- AZ-01 IDOR 洩漏標的
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 房間
CREATE TABLE rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             CHAR(6) UNIQUE NOT NULL,   -- BE-06 用弱亂數產生
  name             TEXT NOT NULL,
  host_player_id   UUID REFERENCES players(id),
  status           TEXT NOT NULL DEFAULT 'waiting',  -- waiting|playing|finished
  draw_interval_ms INT NOT NULL DEFAULT 5000,
  settings         JSONB NOT NULL DEFAULT '{}',      -- BE-13 原型鏈污染標的
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 房間成員與其卡片
CREATE TABLE room_players (
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES players(id) ON DELETE CASCADE,
  card       JSONB NOT NULL,           -- 5x5 數字陣列
  marked     JSONB NOT NULL DEFAULT '[]',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, player_id)
);

-- 抽號紀錄
CREATE TABLE draws (
  id         BIGSERIAL PRIMARY KEY,
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  sequence   INT NOT NULL,
  number     INT NOT NULL,
  phrase     TEXT,                     -- Azure OpenAI 產生的報號詞
  drawn_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, sequence)
);

-- 得獎紀錄
CREATE TABLE wins (
  id         BIGSERIAL PRIMARY KEY,
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES players(id),
  line_type  TEXT NOT NULL,            -- row|col|diag|full
  score      INT NOT NULL,
  verified   BOOLEAN NOT NULL DEFAULT FALSE,  -- BE-15 競爭條件標的
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 聊天訊息
CREATE TABLE chat_messages (
  id         BIGSERIAL PRIMARY KEY,
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES players(id),
  body       TEXT NOT NULL,            -- FE-01 儲存型 XSS 的載體（不做淨化）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 稽核紀錄（Demo 用，也是 BE-11 敏感資料寫入的地方）
CREATE TABLE audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  actor      TEXT,
  action     TEXT NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8. REST API 契約

Base path `/api`。認證：`Authorization: Bearer <JWT>`。

| Method | Path | 說明 | 內含弱點 |
|---|---|---|---|
| POST | `/auth/guest` | 訪客登入，body `{nickname, email?}`，回 `{token, player}` | AZ-02 大量賦值、BE-14 開放重新導向 |
| POST | `/auth/login` | 帳密登入 | BE-07 MD5 |
| POST | `/rooms` | 建房，body `{name, drawIntervalMs?}`，回 `{room}` | BE-06 弱亂數房號 |
| GET | `/rooms/search?q=` | 搜尋房間 | **BE-01 SQL Injection** |
| GET | `/rooms/:code` | 房間詳情 | — |
| POST | `/rooms/:code/join` | 加入房間，回 `{card, roomState}` | BE-09 缺速率限制 |
| POST | `/rooms/:code/report` | 產生賽後戰報圖，body `{format}` | **BE-02 Command Injection** |
| GET | `/players/:id` | 玩家資料 | **AZ-01 IDOR**（回傳 email/phone/ip） |
| POST | `/avatar` | 上傳頭像 | 檔名未淨化 |
| GET | `/avatar/:file` | 下載頭像 | **BE-03 Path Traversal** |
| POST | `/cardset/import` | 匯入自訂卡片組，body `{url}` | **BE-04 SSRF** |
| POST | `/invite` | 邀請好友，body `{roomCode, emails[], phones[]}` | **BE-09 缺速率限制**（簡訊轟炸） |
| GET | `/leaderboard` | 排行榜 | CQ-06 N+1 查詢 |
| PATCH | `/rooms/:code/settings` | 更新房間設定 | **BE-13 原型鏈污染** |
| GET | `/debug/state` | 傾印記憶體中所有房間與玩家狀態 | **AZ-05 除錯端點未移除** |
| GET | `/healthz` | 健康檢查 | — |

---

## 9. Socket.IO 事件契約

Namespace `/`。連線時以 `auth: { token }` 傳遞 JWT。

### Client → Server

| 事件 | Payload | 說明 | 內含弱點 |
|---|---|---|---|
| `room:join` | `{ roomCode }` | 加入房間頻道 | — |
| `room:leave` | `{ roomCode }` | 離開 | CQ-07 未清理 registry |
| `game:start` | `{ roomCode }` | 開始遊戲 | **AZ-04 未驗證是否為房主** |
| `game:draw` | `{ roomCode }` | 手動抽號 | **AZ-04 任何人都能抽號** |
| `card:mark` | `{ roomCode, number }` | 標記格子 | — |
| `bingo:claim` | `{ roomCode, lines }` | 宣告 BINGO | **FE-05 後端信任前端結果**、BE-15 競爭條件 |
| `chat:send` | `{ roomCode, body }` | 發送聊天訊息 | **FE-01 未淨化 HTML** |
| `player:kick` | `{ roomCode, playerId }` | 踢出玩家 | **AZ-04 未驗證權限**（Act 1 現場實作的功能） |

### Server → Client

| 事件 | Payload | 說明 |
|---|---|---|
| `room:state` | `{ room, players, draws, marked }` | 房間完整狀態 |
| `player:joined` | `{ player }` | 有人加入 |
| `player:left` | `{ playerId }` | 有人離開 |
| `game:started` | `{ startedAt }` | 遊戲開始 |
| `game:drawn` | `{ sequence, number, phrase }` | 抽出一個號碼 |
| `game:over` | `{ winners, leaderboard }` | 遊戲結束 |
| `chat:message` | `{ id, player, body, createdAt }` | 聊天訊息廣播 |
| `error` | `{ code, message }` | 錯誤（**刻意包含堆疊資訊**） |

---

## 10. 計分服務契約

Python FastAPI，內部服務，`http://scoring:8000`。

| Method | Path | 說明 | 內含弱點 |
|---|---|---|---|
| POST | `/score/verify` | body `{card, marked, draws}` → `{valid, lines[], score}` | — |
| POST | `/score/import` | 匯入序列化的歷史對局資料 | **BE-05 不安全的反序列化（pickle）** |
| POST | `/score/import-xml` | 匯入 XML 格式卡片組 | **BE-10 XXE** |
| GET | `/stats/leaderboard?limit=` | 統計排行榜 | — |
| GET | `/healthz` | 健康檢查 | — |

> **注意**：`/score/verify` 是遊戲正確性的核心，**必須有真實且完整的測試**（見 R10）。
> 弱點只植入在 import 與統計路徑上。

---

## 11. 環境變數與 Mock 模式

`.env.example`（本檔本身即 SEC-01 的載體之一，會放入格式正確但無效的合成 Key）：

```bash
# ── 通用 ──────────────────────────────────────────
NODE_ENV=development
PORT=3001
WEB_ORIGIN=http://localhost:5173
JWT_SECRET=                      # SEC-09：實作時刻意填入弱值
DEMO_FAST_MODE=true              # 抽號間隔縮短，讓一局 3 分鐘內結束

# ── 資料庫 ────────────────────────────────────────
DATABASE_URL=postgres://bingo:bingo@localhost:5432/bingo
REDIS_URL=redis://localhost:6379

# ── Mock 開關（現場斷網時的救命開關）─────────────
MOCK_AZURE=true                  # true 時所有 Azure 呼叫走本地假實作

# ── Azure OpenAI（AI 報號主持人）──────────────────
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=            # SEC-01：主打的洩漏標的
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini

# ── Azure Blob Storage（頭像／戰報）───────────────
AZURE_STORAGE_CONNECTION_STRING= # SEC-02
AZURE_STORAGE_CONTAINER=avatars

# ── Azure Web PubSub（即時訊息扇出）───────────────
AZURE_WEBPUBSUB_CONNECTION_STRING=

# ── Azure Communication Services（邀請通知）───────
ACS_CONNECTION_STRING=           # SEC-07
ACS_SENDER_EMAIL=

# ── Azure Key Vault（修復版才會用到）──────────────
AZURE_KEY_VAULT_URI=

# ── 內部授權 Token（自訂 Pattern 標的）────────────
BINGO_LICENSE_KEY=               # SEC-08
```

**Mock 模式行為規格**：

| 服務 | `MOCK_AZURE=true` 時的行為 |
|---|---|
| Azure OpenAI | 從本地 20 句預寫報號詞中隨機挑一句 |
| Blob Storage | 寫入本地 `./.data/blobs/` 目錄 |
| Web PubSub | 直接用 Socket.IO 本地廣播 |
| Communication Services | 把 Email／SMS 內容寫到 stdout |

---

## 12. 弱點目錄與植入規格

### 12.1 植入原則（實作者必讀）

1. **一個弱點 = 一個 commit**，commit message 格式：`vuln(SEC-01): hardcode Azure OpenAI key in config`。
2. **不在原始碼留下任何「這裡有漏洞」的註解或標記**。對應關係只寫在本文件與 `VULN-CATALOG.md`。否則 Demo 會失去說服力，客戶會覺得「你們是故意標好給掃描器看的」。
3. 弱點要**寫得像真的疏忽**：合理的變數命名、看起來很自然的錯誤（例如「為了 debug 方便先寫死」、「趕上線先用字串拼接」）。
4. **不要為了塞弱點而破壞遊戲可玩性**。核心遊戲流程（發卡、抽號、連線判定、結算）必須真的能跑完。
5. 每個弱點植入後，必須在 Phase 4 確認**掃描器真的抓得到**。抓不到的就換一種寫法，而不是留著充數。

### 12.2 A 類：機敏資訊洩漏（Secrets）

| ID | 弱點 | 檔案 | 植入方式 | 誰抓到 |
|---|---|---|---|---|
| SEC-01 | Azure OpenAI API Key 硬編碼 | `apps/api/src/config/azure.ts` | `const AZURE_OPENAI_API_KEY = "<合成 key>"` 作為 env 讀不到時的 fallback | Secret Scanning + **Push Protection** |
| SEC-02 | Storage 連線字串硬編碼 | `apps/api/src/services/storage.ts` | 完整 `DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...` 字串 | Secret Scanning |
| SEC-03 | Terraform 內含 Service Principal 密碼 | `infra/terraform/main.tf` | `client_secret = "..."` 直接寫在 provider block | Secret Scanning |
| SEC-04 | 前端 bundle 內含 Azure Maps Key | `apps/web/src/config.ts` | 匯出常數，被 Vite 打包進 JS | Secret Scanning + Copilot Review |
| SEC-05 | 已刪除但仍在 Git 歷史的 `secrets/prod.json` | Git 歷史 | 先 commit 檔案，下一個 commit `git rm` | Secret Scanning（歷史掃描） |
| SEC-06 | GitHub PAT 寫在 Workflow | `.github/workflows/deploy-azure.yml` | `token: ghp_...` 而非用 secrets | Secret Scanning |
| SEC-07 | 測試 fixture 中的 ACS Key | `apps/api/tests/fixtures/notify.json` | 測試資料裡放完整連線字串 | Secret Scanning |
| SEC-08 | 自訂格式的內部授權 Token | `apps/api/src/lib/license.ts` | `BINGO_SK_live_` + 32 字元 | **自訂 Pattern** |
| SEC-09 | JWT 簽章密鑰硬編碼且為弱值 | `apps/api/src/lib/jwt.ts` | `process.env.JWT_SECRET \|\| "bingo-secret-2024"` | Secret Scanning + CodeQL |
| SEC-10 | 資料庫密碼寫在 compose 檔 | `docker-compose.yml` | `POSTGRES_PASSWORD: Sup3rS3cret!Bingo` | AI 通用密碼偵測 |
| SEC-11 | `.env` 未被忽略 | `.gitignore` | 刻意不列 `.env`，並 commit 一份 `.env` | Secret Scanning |

> ### ⚠️ 憑證合規紅線（不可妥協）
> - 所有 Key 一律使用**格式正確但無效**的合成值，優先採用各雲廠商官方文件中公開的 EXAMPLE token。
> - **嚴禁**放入任何真實憑證，即使是已作廢或已輪替的。
> - Phase 4 必須逐一驗證：GitHub Validity Check 對這些值全部回報為無效／無法驗證。
> - 植入 secret 的 commit 需由**第二人複核**後才可推送。
> - Repo 維持 Private 或 Internal 可見性。

### 12.3 B 類：後端弱點（CodeQL — JavaScript / Python）

| ID | 弱點 | CWE | 檔案 | 嚴重度 | 植入方式 |
|---|---|---|---|---|---|
| BE-01 | SQL Injection | CWE-89 | `apps/api/src/routes/rooms.ts` | Critical | `db.query(\`SELECT * FROM rooms WHERE name LIKE '%${q}%'\`)` |
| BE-02 | Command Injection | CWE-78 | `apps/api/src/services/report.ts` | Critical | `exec(\`convert ${tmpPath} -resize 800x ${outPath}\`)` |
| BE-03 | Path Traversal | CWE-22 | `apps/api/src/routes/avatar.ts` | High | `path.join(UPLOAD_DIR, req.params.file)` 無淨化 |
| BE-04 | SSRF | CWE-918 | `apps/api/src/routes/cardset.ts` | High | `fetch(req.body.url)` 無白名單 |
| BE-05 | 不安全的反序列化 | CWE-502 | `apps/scoring/app/importer.py` | Critical | `pickle.loads(request_body)` |
| BE-06 | **弱亂數 → 抽號可預測** | CWE-338 | `apps/api/src/game/drawer.ts` | High | `Math.random()` 產生房號與抽號序列 |
| BE-07 | 密碼以 MD5 儲存 | CWE-327 | `apps/api/src/lib/hash.ts` | High | `crypto.createHash('md5')` 無 salt |
| BE-08 | ReDoS | CWE-1333 | `apps/api/src/validators/nickname.ts` | Medium | `/^([a-zA-Z0-9]+\s?)+$/` 巢狀量詞 |
| BE-09 | 缺少速率限制 | CWE-770 | `apps/api/src/routes/invite.ts` | High | 邀請端點無任何節流，可觸發簡訊轟炸 |
| BE-10 | XXE | CWE-611 | `apps/scoring/app/xml_import.py` | High | `lxml.etree` 未關閉 entity resolution |
| BE-11 | 敏感資料寫入 Log | CWE-532 | `apps/api/src/middleware/logger.ts` | Medium | 記錄完整 `Authorization` 標頭與 request body |
| BE-12 | CORS 萬用字元 + 帶憑證 | CWE-942 | `apps/api/src/app.ts` | High | `cors({ origin: '*', credentials: true })` |
| BE-13 | 原型鏈污染 | CWE-1321 | `apps/api/src/utils/merge.ts` | High | 自寫遞迴 deepMerge，未過濾 `__proto__` |
| BE-14 | 開放重新導向 | CWE-601 | `apps/api/src/routes/auth.ts` | Medium | `res.redirect(req.query.returnTo)` |
| BE-15 | 競爭條件 | CWE-362 | `apps/api/src/game/engine.ts` | Medium | 先查後寫，無交易或鎖 → 重複計分 |

### 12.4 C 類：前端弱點

| ID | 弱點 | CWE | 檔案 | 植入方式 |
|---|---|---|---|---|
| FE-01 | 儲存型 XSS | CWE-79 | `apps/web/src/components/ChatMessage.tsx` | `dangerouslySetInnerHTML={{ __html: msg.body }}` |
| FE-02 | DOM XSS | CWE-79 | `apps/web/src/pages/JoinRoom.tsx` | 從 `location.hash` 取房號後寫入 `innerHTML` |
| FE-03 | `postMessage` 未驗證來源 | CWE-346 | `apps/web/src/lib/embed.ts` | `window.addEventListener('message', ...)` 不檢查 `event.origin` |
| FE-04 | `target="_blank"` 無 `rel` | CWE-1022 | `apps/web/src/components/ShareLink.tsx` | 分享連結開新視窗 |
| FE-05 | **前端判定 BINGO 且被後端信任** | CWE-602 | `apps/web/src/game/checkBingo.ts` | 前端算出 `lines` 直接送 `bingo:claim`，後端照單全收 |
| FE-06 | JWT 存於 `localStorage` | CWE-922 | `apps/web/src/lib/auth.ts` | `localStorage.setItem('token', ...)` |
| FE-07 | 未設安全標頭與 CSP | CWE-1021 | `apps/api/src/app.ts` | helmet 已安裝但被註解掉，附上「暫時關掉方便本機開發」的註解 |

### 12.5 D 類：授權與 API 設計

| ID | 弱點 | CWE | 檔案 | 植入方式 |
|---|---|---|---|---|
| AZ-01 | IDOR | CWE-639 | `apps/api/src/routes/players.ts` | `GET /players/:id` 直接回傳整列，含 email/phone/last_ip，且不檢查是否為本人 |
| AZ-02 | 大量賦值 | CWE-915 | `apps/api/src/routes/auth.ts` | `Object.assign(player, req.body)` → 可自行帶 `is_admin: true` |
| AZ-03 | JWT 驗證缺陷 | CWE-347 | `apps/api/src/lib/jwt.ts` | `jwt.verify(token, secret, { algorithms: ['HS256','none'] })`、不驗 `exp` |
| AZ-04 | **Socket.IO 事件未驗證權限** | CWE-862 | `apps/api/src/sockets/handlers.ts` | `game:draw`、`game:start`、`player:kick` 皆不檢查是否為房主 |
| AZ-05 | 除錯端點未移除 | CWE-489 | `apps/api/src/routes/debug.ts` | `GET /api/debug/state` 傾印所有房間與玩家（含 JWT） |

### 12.6 E 類：相依套件與供應鏈

| ID | 內容 | 觸發功能 |
|---|---|---|
| DEP-01 | Node 端植入含已知 CVE 的舊版套件：`lodash`、`minimist`、`jsonwebtoken`、`axios`、`ws`、`node-serialize`、`express` | Dependabot Alerts |
| DEP-02 | Python 端植入含已知 CVE 的舊版套件：`PyYAML`、`requests`、`Jinja2`、`lxml` | Dependabot Alerts |
| DEP-03 | 在 `demo/act2-new-feature` 分支的 PR 中新增一個高風險套件 | Dependency Review 阻擋 |
| DEP-04 | 引入 LGPL-2.0 授權套件，觸發 `deny-licenses` | Dependency Review 授權檢查 |
| DEP-05 | Lockfile 與 manifest 版本不一致 | CI 檢查失敗 |

> **實作要點**：具體版本號在 Phase 3 實作時，到 GitHub Advisory Database 查詢當下確實有 advisory 的版本再釘住。不要憑記憶寫版本號——advisory 會變。詳見 `research.md` R-07。

### 12.7 F 類：基礎架構、容器與 Actions

| ID | 弱點 | 檔案 | 植入方式 |
|---|---|---|---|
| INF-01 | Dockerfile 不安全 | `apps/api/Dockerfile` | `FROM node:latest`、以 root 執行、無 `HEALTHCHECK`、`COPY . .` 帶入 `.env` |
| INF-02 | Bicep：Storage 設定不安全 | `infra/bicep/storage.bicep` | `allowBlobPublicAccess: true`、`supportsHttpsTrafficOnly: false`、`minimumTlsVersion: 'TLS1_0'` |
| INF-03 | Terraform：NSG 全開 | `infra/terraform/network.tf` | `source_address_prefix = "0.0.0.0/0"` 對 22／3389 |
| INF-04 | Actions 未 pin SHA | `.github/workflows/ci.yml` | 用 `actions/checkout@v4` 浮動 tag（對照組：`codeql.yml` 用 pin SHA） |
| INF-05 | `pull_request_target` 誤用 | `.github/workflows/pr-label.yml` | `pull_request_target` + `ref: ${{ github.event.pull_request.head.sha }}` + 執行 PR 內的腳本 |
| INF-06 | `GITHUB_TOKEN` 權限過大 | 多個 workflow | `permissions: write-all` |
| INF-07 | 使用長期憑證而非 OIDC | `.github/workflows/deploy-azure.yml` | `creds` 用長期 Service Principal 密碼 |

### 12.8 G 類：程式碼品質（給 Copilot Code Review 發揮）

| ID | 問題 | 檔案 | 植入方式 |
|---|---|---|---|
| CQ-01 | 700+ 行萬用函式 | `apps/api/src/game/engine.ts` | 單一 `handleGameEvent()` 內含巨大 switch，混雜 IO、驗證、計分、廣播 |
| CQ-02 | 計分邏輯重複三份且行為不一致 | web／api／scoring 各一份 | 三處 `checkBingo` 實作，對角線判定邏輯刻意不同 |
| CQ-03 | Promise 未 catch、錯誤被吞掉 | `apps/api/src/services/` | `try { ... } catch (e) {}` 空 catch |
| CQ-04 | 大量魔術數字 | `apps/api/src/game/` | `if (score > 87)`、`setTimeout(fn, 4300)` |
| CQ-05 | 測試覆蓋率 < 20%，**核心 BINGO 判定完全沒測試** | `apps/api/tests/` | 只留一個 `healthz` 的測試 |
| CQ-06 | 排行榜 N+1 查詢 | `apps/api/src/routes/leaderboard.ts` | 迴圈內逐筆 query 玩家資料 |
| CQ-07 | 記憶體洩漏 | `apps/api/src/sockets/registry.ts` | `disconnect` 時未從 room Map 移除 socket |
| CQ-08 | 命名風格混雜、`any` 滿天飛 | 全專案 | 混用 camelCase／snake_case，關鍵函式回傳 `any` |

### 12.9 弱點總計

| 類別 | 數量 |
|---|---|
| A 機敏資訊 | 11 |
| B 後端 | 15 |
| C 前端 | 7 |
| D 授權 | 5 |
| E 相依套件 | 5 |
| F 基礎架構 | 7 |
| G 程式品質 | 8 |
| **合計** | **58** |

---

## 13. GitHub 平台設定規格

### 13.1 CodeQL Workflow（`.github/workflows/codeql.yml`）

依 `research.md` R-03 的查證結果，使用 `github/codeql-action@v4`，語言識別碼為 `javascript-typescript`、`python`、`actions`：

```yaml
name: CodeQL
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 3 * * 1'

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read
    strategy:
      fail-fast: false
      matrix:
        language: ['javascript-typescript', 'python', 'actions']
    steps:
      - uses: actions/checkout@v4
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v4
        with:
          languages: ${{ matrix.language }}
          config-file: ./.github/codeql/codeql-config.yml
          queries: security-extended
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v4
```

`.github/codeql/codeql-config.yml`：

```yaml
name: BingoBlitz CodeQL config
paths:
  - apps
  - packages
paths-ignore:
  - '**/node_modules'
  - '**/*.test.ts'
  - '**/dist'
```

> **必須用 `security-extended`**，不能用預設的 `security` suite。預設 suite 會漏掉部分我們刻意植入的弱點（例如 log injection、部分 CWE-1333）。Phase 4 需實測比對兩者的 alert 數量差異——這個差異本身就是一個很好的 Demo 素材。

### 13.2 Dependency Review（`.github/workflows/dependency-review.yml`）

```yaml
name: Dependency Review
on: [pull_request]
permissions:
  contents: read
  pull-requests: write
jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: moderate
          deny-licenses: LGPL-2.0, LGPL-3.0, AGPL-3.0
          comment-summary-in-pr: always
```

### 13.3 Dependabot（`.github/dependabot.yml`）

三個 ecosystem：`npm`（`/apps/api`、`/apps/web`）、`pip`（`/apps/scoring`）、`github-actions`（`/`）、`docker`。

### 13.4 Repository Ruleset（`main` 分支）

- 要求 Pull Request，至少 1 位核准者
- 要求以下狀態檢查通過：`CodeQL / analyze (javascript-typescript)`、`Dependency Review`、`CI / test`
- 要求分支為最新
- 禁止強制推送、禁止刪除分支
- **不繞過** Push Protection（bypass 僅開放給指定的 Demo 主持人帳號，且需留稽核紀錄）

### 13.5 組織層級 Security Configuration

建立名為 `bingo-demo-baseline` 的安全設定檔並套用：

| 功能 | 設定 |
|---|---|
| Secret Scanning | 啟用 |
| Push Protection | 啟用 |
| Validity Checks | 啟用 |
| 通用密碼 / AI 偵測 | 啟用 |
| Code Scanning 預設設定 | 啟用（之後由 advanced setup 覆蓋） |
| Dependabot Alerts | 啟用 |
| Dependabot Security Updates | 啟用 |
| Private Vulnerability Reporting | 啟用 |

### 13.6 自訂 Secret Scanning Pattern

| 欄位 | 值 |
|---|---|
| 名稱 | `BingoBlitz Internal License Key` |
| Secret format | `BINGO_SK_live_[A-Za-z0-9]{32}` |
| Before secret | `(?:license\|LICENSE\|key)\W{0,10}` |
| Push protection | 啟用（需先在 repo 層級 dry run 驗證通過，見 `research.md` R-05） |

### 13.7 Copilot 自訂指令（`.github/copilot-instructions.md`）

內容要能在 Act 1 展示「加了指令之後，Copilot 產生的程式碼就變安全了」的對比。至少包含：

- 一律使用參數化查詢，禁止字串拼接 SQL
- 機敏資訊一律從 Azure Key Vault 讀取，禁止硬編碼與 fallback 預設值
- 所有使用者輸入都必須經過 schema 驗證（zod）
- 產生亂數一律使用 `crypto.randomInt`，禁用 `Math.random()`
- 所有 Socket.IO 事件處理器都必須先檢查呼叫者權限
- React 中禁用 `dangerouslySetInnerHTML`

---
---

# 第三部：執行

## 14. 分支策略與 Demo 狀態管理

### 14.1 分支設計

| 分支／標籤 | 用途 |
|---|---|
| `main` | **有弱點的基準版**。所有 Demo 都從這裡開始。 |
| `demo-baseline-v1`（tag） | 每場 Demo 重置的錨點 |
| `demo/act1-leak-key` | Act 1 預備分支（用來演 Push Protection） |
| `demo/act2-new-feature` | Act 2 預備 PR 分支（帶 SQLi + 舊版 lodash + LGPL 套件） |
| `solution/hardened` | **完整修復版**。客戶問「修完長什麼樣」時直接切過去比對 |

### 14.2 重置機制（關鍵）

Live Demo 最怕的就是「上一場的殘留狀態」。`scripts/reset-demo.sh` 必須做到：

1. 刪除所有 `demo/*` 分支（本地與遠端）與相關 PR
2. 透過 GitHub REST API 將 Security Alerts 狀態重設為 `open`
3. 將 `main` 強制重設到 `demo-baseline-v1` 標籤
4. 清空資料庫並重新 seed
5. 執行 `verify-alerts.sh` 確認基準狀態正確

**更保險的做法（建議採用）**：把整個 repo 做成組織內的 **Template Repository**，每場 Demo 從範本開一個新 repo（例如 `ghas-demo-2026-09-10-客戶名`）。這樣掃描會全部重跑一次，客戶還能看到「從零開始啟用 GHAS 的完整過程」，而且完全不會有殘留。Demo 後直接刪除。

---

## 15. 執行階段與時程

總工期約 **4 週**（以 1 名全職工程師 + 0.5 名售前顧問估算）。

| 階段 | 工作內容 | 工期 | 產出 |
|---|---|---|---|
| **Phase 0**<br>前置準備 | 確認 GitHub 方案與 GHAS 授權；建立 Demo 組織；確認 Azure 訂閱；確定命名與品牌 | 0.5 天 | 環境就緒檢查表 |
| **Phase 1**<br>骨架 | Monorepo 結構、docker-compose、基礎 CI、程式碼規範、共用型別 | 2 天 | `docker compose up` 可跑 |
| **Phase 2**<br>遊戲核心 | 先寫**乾淨、能玩**的完整賓果遊戲（含即時連線、Azure 整合、Mock 模式、Seed 資料） | 5 天 | 可完整玩一局 |
| **Phase 3**<br>植入弱點 | 依第 12 節逐條植入，**每條一個 commit** | 3 天 | 58 個弱點全數就位 |
| **Phase 4**<br>GitHub 設定 | 啟用各項安全功能、自訂 Pattern、Rulesets；**逐項驗證 alert 確實出現** | 2 天 | `verify-alerts.sh` 全綠 |
| **Phase 5**<br>Demo 資產 | 主持稿、重置腳本、投影片、客戶 Handout、備援錄影、截圖包 | 3 天 | Demo Kit |
| **Phase 6**<br>彩排 | 完整演練 3 次以上、計時、斷網演練、找同事當假客戶提問 | 2 天 | 彩排紀錄與修正清單 |
| **Phase 7**<br>交付 | 建立 Template Repo、對售前團隊做 Enablement 教學 | 1 天 | 團隊可獨立操作 |

### 里程碑

- **M1（第 1 週末）**：遊戲可玩 —— 這是專案最大的風險點，先攻下。
- **M2（第 2 週末）**：弱點全數植入且 GitHub 掃描全部觸發。
- **M3（第 3 週末）**：主持稿完成、第一次完整彩排。
- **M4（第 4 週末）**：交付，售前團隊可獨立執行。

---

## 16. 驗收標準 DoD

### 16.1 應用程式層

- [ ] `docker compose up` 一個指令即可啟動完整本地環境
- [ ] 從建房到結算，**一局可在 3 分鐘內完成**
- [ ] 手機瀏覽器體驗流暢（客戶會用自己的手機）
- [ ] `MOCK_AZURE=true` 時，完全不需要 Azure 訂閱也能跑完整流程
- [ ] `scripts/seed.sh` 可灌入假資料，排行榜不空
- [ ] 3 個以上瀏覽器同時連線，即時同步無異常

### 16.2 安全掃描層

- [ ] Secret Scanning 產出 **≥ 9 個** alert（含 1 個自訂 Pattern、1 個歷史洩漏）
- [ ] Push Protection **100% 可重現**地阻擋 Act 1 的推送
- [ ] CodeQL 產出 **≥ 20 個** alert，涵蓋 `javascript-typescript` 與 `python`
- [ ] 其中 **≥ 6 個** alert 支援 Copilot Autofix 並能產生合理修復
- [ ] Dependabot 產出 **≥ 8 個** alert，含 **≥ 2 個** Critical
- [ ] Dependency Review 能在 `demo/act2-new-feature` 的 PR 中確實阻擋
- [ ] Copilot Code Review 在 Demo PR 上會留下 **≥ 3 則**有意義的意見
- [ ] `scripts/verify-alerts.sh` 執行結果全綠

### 16.3 憑證合規層

- [ ] 所有機敏字串經逐一確認為合成值，無任何真實憑證
- [ ] GitHub Validity Check 對所有植入的 Key 均回報無效／無法驗證
- [ ] 植入 secret 的 commit 均有第二人複核紀錄
- [ ] Repo 可見性為 Private 或 Internal
- [ ] `README.md` 首屏與 `SECURITY-DEMO-NOTICE.md` 警語就位

### 16.4 Demo 營運層

- [ ] `scripts/reset-demo.sh` **5 分鐘內**回到基準狀態
- [ ] 完整備援錄影（60 分鐘版全程），現場斷網時可直接播
- [ ] 每個橋段的關鍵畫面截圖包
- [ ] 主持稿完成，且經過**一位非工程背景同仁**實測可獨立執行
- [ ] 已完成 3 次以上完整彩排並記錄

---

## 17. 風險與對策

| # | 風險 | 影響 | 對策 |
|---|---|---|---|
| R1 | 假 Key 被誤認為真實憑證，或不慎混入真實憑證 | **極高**（資安事件） | 一律使用雲廠商官方 EXAMPLE token 或明確合成值；Repo 設 Private／Internal；Phase 4 逐一驗證 Validity Check；植入 commit 由第二人複核 |
| R2 | 弱點程式碼被複製到正式專案 | 高 | `README.md` 首行與 `SECURITY-DEMO-NOTICE.md` 明確警語；LICENSE 加註限制；Repo 名稱含 `DEMO`；不公開發布 |
| R3 | 現場網路不通或 Azure 服務異常 | 高 | Mock 模式、本地 docker-compose、全程備援錄影、手機熱點備援 |
| R4 | CodeQL 掃描耗時過久，Demo 現場等不了 | 中 | 事先跑完，現場展示既有 alert；如需現場觸發，用 `paths` 限縮掃描範圍到單一資料夾 |
| R5 | Copilot Autofix 每次產出的修復不同，可能不如預期 | 中 | 彩排時記錄實際輸出；準備話術：「AI 給的是建議，人仍需審核——這正是 GitHub 把它放在 PR 流程中而非自動合併的原因」。**誠實面對反而是加分點** |
| R6 | GHAS 授權或組織權限不足 | 高 | Phase 0 就確認；必要時申請 GHAS 試用；部分功能（公開 repo 的 Autofix）可用免費額度演示 |
| R7 | Push Protection 對非合作夥伴格式的密鑰不觸發 | 中 | 只挑選已驗證會觸發的 Pattern；自訂 Pattern 需在 Phase 4 完成 dry run 實測後才納入劇本 |
| R8 | 客戶環境的防火牆擋住 github.com | 中 | 事前確認；改用自備網路；最差情況播錄影 |
| R9 | 弱點太多，Demo 節奏拖沓 | 中 | 劇本只演 8–10 個弱點，其餘作為「存量」在 Security Overview 中呈現數字 |
| R10 | 遊戲有真實 bug 導致現場玩不起來 | 高 | Phase 2 就把遊戲本身做扎實；**核心賓果判定必須有真實測試**（諷刺的是，這部分不能故意寫爛）；Phase 6 用 Playwright 做 E2E 回歸 |
| R11 | 相依套件的 advisory 隨時間變動，Dependabot alert 數量下降 | 中 | 版本號在 Phase 3 當下查 Advisory Database 再釘；`verify-alerts.sh` 納入 CI 每週跑，發現數量下降就補 |

---

## 18. 待確認事項

在 Phase 0 開始前需要確認（**這些答案會改變哪些功能演得出來**）：

1. **GitHub 方案**：Enterprise Cloud 還是 Team？是否已有 GHAS（Secret Protection／Code Security）授權或試用額度？
2. **Copilot 授權層級**：Business 還是 Enterprise？（Copilot Code Review、Coding Agent 的可用性不同）
3. **Azure 訂閱**：是否有可用訂閱？若無，是否全面採用 Mock 模式？
4. **目標客戶產業**：金融／製造／零售？賓果主題可依產業客製。
5. **Demo 語言**：中文為主？是否需要英文版主持稿？
6. **是否需要投影片**：或全程實機操作？
7. **Repo 可見性**：Private、Internal，還是 Public？（Public 才有免費的 Autofix，但有外流風險——建議 Internal）

---

## 19. 後續延伸

專案交付後，可依客戶需求逐步擴充：

- **更多語言**：加入 Java（Spring Boot）或 C#（.NET）服務，展示 CodeQL 的完整語言覆蓋度
- **Copilot Enterprise 深度功能**：Knowledge Base、Copilot Spaces、PR 摘要客製
- **Runner 安全**：自架 Runner 與 Actions Runner Controller 的安全實務
- **產業客製版**：把賓果換皮成客戶產業情境，程式碼骨架與弱點目錄可完全沿用
- **競品對照版**：一頁「同樣的弱點，在 GitHub 與其他工具鏈上分別要花多少步驟修好」
- **客戶動手版（Workshop）**：把 Demo 轉成 2 小時的客戶實作工作坊，讓客戶親手修弱點——這通常是最有效的成交前置動作

---

*本文件為內部行銷資產規劃文件。專案內含刻意設計的資安弱點，僅供教育與展示用途，嚴禁部署於任何正式環境。*
