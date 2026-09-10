# BingoBlitz — 任務拆解 (tasks.md)

> 本檔由 [`plan.md`](plan.md) 推導而來。**`plan.md` 是唯一權威**；若兩者衝突，以 `plan.md` 為準，並回頭修正本檔。
> 技術依據與查證來源見 [`research.md`](research.md)。

> ## 🚧 2026-09-10 範圍調整
> 現有帳號**無 GitHub Organization 層級權限**，專案落在個人公開 repo。
> **Act 3（管理者視角）暫緩**，Demo 改走兩幕版。受影響的任務已標記 🚧，
> 規格完整保留，取得組織權限後直接啟用。
> 詳見 [`plan.md` 3.6 節](plan.md#36-能力可用性與目前限制)。

## 使用方式

- 任務編號：`T-{Phase}{序號}`，例如 `T-201`。
- 依序執行；有 `依賴` 的任務必須等依賴完成。
- 每個任務都有**完成定義（DoD）**，沒達成就不能勾選。
- 每完成一個任務就 commit 一次，commit message 前綴見各 Phase 說明。
- 每個 Phase 結束時執行該 Phase 的**關卡檢查**，未通過不得進入下一 Phase。

## 進度總覽

| Phase | 主題 | 任務數 | 工期 | 狀態 |
|---|---|---|---|---|
| 0 | 前置準備 | 5 | 0.5 天 | ⬜ 未開始 |
| 1 | 骨架 | 9 | 2 天 | ⬜ 未開始 |
| 2 | 遊戲核心（乾淨版） | 14 | 5 天 | ⬜ 未開始 |
| 3 | 植入弱點 | 12 | 3 天 | ⬜ 未開始 |
| 4 | GitHub 平台設定與驗證 | 11（1 項 🚧 暫緩） | 2 天 | ⬜ 未開始 |
| 5 | Demo 資產 | 8 | 3 天 | ⬜ 未開始 |
| 6 | 彩排 | 5 | 2 天 | ⬜ 未開始 |
| 7 | 交付 | 4 | 1 天 | ⬜ 未開始 |
| | **合計** | **68**（實作 67，🚧 暫緩 1） | **18.5 天** | |

---

## Phase 0 — 前置準備

> commit 前綴：`chore:`
> **這個 Phase 不寫程式，但它決定後面哪些功能演得出來。不要跳過。**

### 🟡 T-001 確認 GitHub 授權與方案（部分完成）
- **依賴**：無
- **內容**：確認 GitHub 方案、是否具備 GitHub Secret Protection 與 GitHub Code Security 授權、Copilot 授權層級。
- **2026-09-10 已確認**：個人帳號，**無組織層級權限** → Act 3 暫緩（`plan.md` 3.6 節已記錄）。
  公開 repo 可免費使用 CodeQL、Copilot Autofix、Dependabot。
- **仍待確認**：Copilot 授權層級（Business / Enterprise）→ 決定 Copilot Code Review（P3）能否演。
- **DoD**：在 `docs/GHAS-SETUP.md` 中記錄實際方案與可用功能清單；`plan.md` 3.6 節的可用性表格經 Phase 4 實測後回填。
- **⚠️ 這是阻斷性任務**：Copilot Code Review 的可用性直接決定 Act 2 能否成立。

### ✅ T-002 建立 Repository（2026-09-10 完成）
- **依賴**：T-001
- **原內容**：建立專用 GitHub Organization；建立 repo，可見性設為 Internal 或 Private。
- **實際做法**：🚧 無組織權限 → 建於個人帳號 `jeff1121/GitHub-Advanced-Security-DEMO`，
  可見性設為 **Public**（判定無機密性，且公開 repo 才有免費的 Autofix 與 CodeQL）。
- **DoD**：✅ repo 已建立、✅ 可見性為 Public、✅ `README.md` 首屏警語就位、✅ `SECURITY-DEMO-NOTICE.md` 就位。
- **⚠️ Phase 3 開工前須重新確認可見性**：屆時 58 條弱點與合成憑證會全部公開，見 `plan.md` 第 18 節第 7 點。

### ⬜ T-003 確認 Azure 訂閱與 Mock 決策
- **依賴**：無
- **內容**：確認是否有可用 Azure 訂閱。若無，確認全面採用 `MOCK_AZURE=true` 模式。
- **DoD**：`docs/AZURE-SETUP.md` 記錄決策；若採 Mock，明確標註哪些 Demo 橋段不受影響（提示：Secret Scanning 完全不受影響）。

### 🟡 T-004 回答 plan.md 第 18 節的 7 個待確認事項（2/7 已答）
- **依賴**：T-001、T-003
- **已答**：第 1 項（GitHub 方案：個人帳號無組織權限）、第 7 項（可見性：Public）。
- **待答**：第 2–6 項（Copilot 授權層級、Azure 訂閱、目標客戶產業、Demo 語言、是否需投影片）。
- **DoD**：7 項全部有明確答案並回填 `plan.md` 第 18 節。

### ⬜ T-005 建立憑證合規檢查流程
- **依賴**：T-002
- **內容**：指定第二人複核者；建立合成憑證清單檔（不進版控，用共用密碼管理工具或內部文件）；確認所有預計植入的假 Key 來源（優先用雲廠商官方 EXAMPLE token）。
- **DoD**：合規檢查表建立完成，複核者已確認接受此角色。
- **⚠️ 這是本專案唯一不能出錯的環節。**

### 🚪 Phase 0 關卡檢查
- [ ] 7 個待確認事項全部有答案
- [ ] 38 個能力觸點已標記可用性
- [ ] 憑證複核者已就位

---

## Phase 1 — 骨架

> commit 前綴：`chore:` / `build:`
> **目標**：`docker compose up` 能起來，CI 能跑，但還沒有遊戲邏輯。

### ⬜ T-101 建立 monorepo 結構
- **依賴**：T-002
- **內容**：依 `plan.md` 第 6 節建立完整目錄結構（先建空目錄與 placeholder）。採 npm workspaces。
- **DoD**：目錄結構與 `plan.md` 第 6 節一致；`npm install` 於根目錄可成功。

### ⬜ T-102 建立 `packages/shared` 共用型別
- **依賴**：T-101
- **內容**：依 `plan.md` 第 7–10 節定義 TypeScript 型別：`Player`、`Room`、`BingoCard`、`Draw`、`ChatMessage`，以及 Socket.IO 事件的 payload 型別。
- **DoD**：`apps/web` 與 `apps/api` 都能 import 這些型別並通過 `tsc --noEmit`。

### ⬜ T-103 建立 `apps/api` Express + Socket.IO 骨架
- **依賴**：T-102
- **內容**：Express app、Socket.IO server、`/api/healthz` 端點、優雅關閉。**此時 helmet 與 CORS 先寫成安全的正確版本**（Phase 3 才改壞）。
- **DoD**：`curl localhost:3001/api/healthz` 回 200。

### ⬜ T-104 建立 `apps/web` React + Vite 骨架
- **依賴**：T-102
- **內容**：Vite + React 19 + TypeScript + TailwindCSS；路由（Home / CreateRoom / JoinRoom / GameRoom / Result）；Socket.IO client 連線封裝。
- **DoD**：`npm run dev` 可開啟首頁，且能連上後端 Socket.IO。

### ⬜ T-105 建立 `apps/scoring` FastAPI 骨架
- **依賴**：T-101
- **內容**：FastAPI app、`/healthz`、pytest 設定。
- **DoD**：`uvicorn` 可啟動，`/healthz` 回 200，`pytest` 可跑。

### ⬜ T-106 建立 `docker-compose.yml`
- **依賴**：T-103、T-104、T-105
- **內容**：postgres 16、redis 7、api、web、scoring 五個服務；healthcheck；volume 掛載支援熱重載。**此時密碼先用環境變數，Phase 3 才寫死。**
- **DoD**：`docker compose up` 五個服務全部 healthy；前端可透過瀏覽器存取。

### ⬜ T-107 建立資料庫 schema 與 migration
- **依賴**：T-106
- **內容**：依 `plan.md` 第 7 節建立所有資料表與 migration 機制。
- **DoD**：`npm run db:migrate` 可建立所有表；重跑不報錯（冪等）。

### ⬜ T-108 建立 `.env.example` 與設定載入層
- **依賴**：T-103
- **內容**：依 `plan.md` 第 11 節建立 `.env.example`（**此時所有 Key 欄位留空**）；建立設定載入模組，缺必要變數時明確報錯。
- **DoD**：缺變數時啟動會報出清楚的錯誤訊息，而不是靜默失敗。

### ⬜ T-109 建立基礎 CI（`.github/workflows/ci.yml`）
- **依賴**：T-103、T-104、T-105
- **內容**：lint、typecheck、build、test 四個 job。**此時 permissions 與 action pin 先寫成安全的正確版本。**
- **DoD**：push 後 CI 全綠。

### 🚪 Phase 1 關卡檢查
- [ ] `docker compose up` 五個服務全部 healthy
- [ ] CI 全綠
- [ ] 前端可連上後端 Socket.IO

---

## Phase 2 — 遊戲核心（乾淨版）

> commit 前綴：`feat:`
> **這是本專案最大的風險點（R10）。遊戲必須真的好玩、真的不當機。**
> **本 Phase 一律寫「正確、安全」的程式碼**——弱點在 Phase 3 才植入。這樣做的好處是：
> `solution/hardened` 分支可以直接從 Phase 2 結束的 commit 拉出來，省下重寫修復版的工。

### ⬜ T-201 訪客認證與 JWT
- **依賴**：T-107、T-108
- **內容**：`POST /api/auth/guest`、`POST /api/auth/login`；JWT 簽發與驗證中介層。**此時使用強密鑰、僅允許 HS256、驗證 exp、密碼用 bcrypt。**
- **DoD**：可取得 token；帶錯誤 token 回 401；過期 token 回 401。

### ⬜ T-202 房間 CRUD
- **依賴**：T-201
- **內容**：建房、查房、搜尋房間、更新設定。**房號用 `crypto.randomInt` 產生**；搜尋用參數化查詢；設定更新用 schema 驗證。
- **DoD**：可建立房間並取得 6 碼房號；房號無重複（1000 次測試）。

### ⬜ T-203 賓果卡產生器
- **依賴**：T-202
- **內容**：標準 5×5 賓果卡（B:1-15, I:16-30, N:31-45 含免費格, G:46-60, O:61-75），使用 `crypto.randomInt`。
- **DoD**：**單元測試覆蓋**：每欄數字範圍正確、無重複、中心為免費格。

### ⬜ T-204 抽號引擎
- **依賴**：T-203
- **內容**：`apps/api/src/game/drawer.ts`。從剩餘號碼中以 CSPRNG 抽號；不重複；抽完 75 顆結束。支援 `DEMO_FAST_MODE`。
- **DoD**：**單元測試覆蓋**：75 次抽完且無重複；第 76 次回傳結束訊號。

### ⬜ T-205 賓果連線判定（核心，必須有完整測試）
- **依賴**：T-203
- **內容**：判定 row / col / diag / full house。此邏輯**只實作一份**，放在 `packages/shared`，前後端共用。
- **DoD**：**至少 15 個單元測試案例**，涵蓋：單橫線、單直線、兩條對角、免費格參與、full house、無連線、邊界情況。覆蓋率 100%。
- **⚠️ 這是 R10 的核心防線。Phase 3 會刻意把這份邏輯複製成三份並讓行為不一致（CQ-02），但原始的正確版本要保留在 git 歷史中。**

### ⬜ T-206 遊戲狀態機
- **依賴**：T-204、T-205
- **內容**：`apps/api/src/game/engine.ts`。狀態轉換 waiting → playing → finished；抽號排程；BINGO 宣告驗證（**後端重新驗證，不信任前端**）；計分。**此時寫成乾淨的小函式，Phase 3 才合併成 God Function。**
- **DoD**：可用測試模擬一場完整遊戲從開始到結束。

### ⬜ T-207 Socket.IO 事件處理器
- **依賴**：T-206
- **內容**：實作 `plan.md` 第 9 節的所有事件。**此時每個事件都有完整的權限檢查**（房主才能 start/draw/kick）。連線 registry 正確清理。
- **DoD**：兩個瀏覽器分頁可同房即時同步；房主離線後房間狀態正確處理。

### ⬜ T-208 前端遊戲畫面
- **依賴**：T-207
- **內容**：BingoCard 元件（點擊標記、連線高亮）、抽號顯示、玩家列表、聊天室、勝利動畫與彩帶、音效。
- **DoD**：手機 Safari 與 Chrome 皆可正常操作；一局可完整玩完。
- **⚠️ 視覺效果直接影響 Demo 開場的暖場效果，不要省。**

### ⬜ T-209 聊天室
- **依賴**：T-207
- **內容**：發送、廣播、持久化。**此時做完整的 HTML 淨化。**
- **DoD**：送出 `<script>alert(1)</script>` 會以純文字顯示。

### ⬜ T-210 Azure 服務整合層 + Mock 模式
- **依賴**：T-206
- **內容**：`services/openai.ts`（AI 報號詞）、`services/storage.ts`（頭像／戰報）、`services/notify.ts`（邀請）。全部支援 `MOCK_AZURE=true`，行為依 `plan.md` 第 11 節。**此時憑證一律從環境變數讀，無 fallback。**
- **DoD**：`MOCK_AZURE=true` 時完整流程可跑完，且不需任何 Azure 憑證。

### ⬜ T-211 頭像上傳與下載
- **依賴**：T-210
- **內容**：`POST /api/avatar`、`GET /api/avatar/:file`。**此時檔名做 UUID 重新命名、路徑做 normalize 檢查。**
- **DoD**：上傳後可正確顯示；`../../etc/passwd` 會被拒絕。

### ⬜ T-212 排行榜與賽後戰報
- **依賴**：T-206、T-210
- **內容**：`GET /api/leaderboard`（**單一 JOIN 查詢**）、`POST /api/rooms/:code/report`（產生戰報圖，**用 sharp 函式庫而非 shell**）。
- **DoD**：排行榜正確排序；戰報圖可產生並顯示。

### ⬜ T-213 計分服務實作
- **依賴**：T-205
- **內容**：`apps/scoring` 的 `/score/verify`、`/stats/leaderboard`、`/score/import`（**此時用 JSON，不用 pickle**）、`/score/import-xml`（**此時關閉 entity resolution**）。
- **DoD**：pytest 全綠；`/score/verify` 與 T-205 的 TypeScript 版本結果一致（跨語言一致性測試）。

### ⬜ T-214 Seed 腳本與 QR Code 分享
- **依賴**：T-212
- **內容**：`scripts/seed.sh` 灌入 20 個假玩家與 10 場歷史對局；房間分享連結產生 QR Code。
- **DoD**：seed 後排行榜有資料；手機掃 QR Code 可直接進入加入房間頁面。

### 🚪 Phase 2 關卡檢查（M1 里程碑）
- [ ] 三個以上瀏覽器同時連線，可完整玩完一局
- [ ] 手機掃 QR Code 可加入
- [ ] 一局在 3 分鐘內完成（`DEMO_FAST_MODE=true`）
- [ ] `MOCK_AZURE=true` 全流程可跑
- [ ] `packages/shared` 的賓果判定測試覆蓋率 100%
- [ ] **建立 tag `clean-baseline`，並從此拉出 `solution/hardened` 分支**

---

## Phase 3 — 植入弱點

> commit 前綴：`vuln({ID}):`，例如 `vuln(SEC-01): hardcode Azure OpenAI key in config`
> **每個弱點一個 commit，不可合併。**
> **絕對不在程式碼留下「這裡有漏洞」的註解**（見 `plan.md` 12.1 第 2 點）。

### ⬜ T-301 植入 A 類：機敏資訊洩漏（SEC-01 ~ SEC-11）
- **依賴**：T-005（憑證合規流程）、Phase 2 完成
- **內容**：依 `plan.md` 12.2 的 11 條逐一植入。
- **特別注意**：
  - SEC-05 需要兩個 commit：先 add `secrets/prod.json`，再 `git rm`
  - SEC-11 需要修改 `.gitignore` 並實際 commit 一份 `.env`
  - 植入前 **Push Protection 尚未啟用**（Phase 4 才開），否則推不上去
- **DoD**：11 條全部植入；**第二人複核簽章完成**；所有 Key 確認為合成值。

### ⬜ T-302 植入 B 類注入型弱點（BE-01 ~ BE-05）
- **依賴**：T-301
- **內容**：SQLi、Command Injection、Path Traversal、SSRF、不安全反序列化。
- **DoD**：5 條植入完成；每條都能手動驗證「攻擊真的有效」（例如 `q=' OR 1=1--` 真的回傳全部房間）。

### ⬜ T-303 植入 B 類密碼學與邏輯弱點（BE-06 ~ BE-10）
- **依賴**：T-302
- **內容**：弱亂數、MD5、ReDoS、缺速率限制、XXE。
- **DoD**：5 條植入完成。**BE-06 需額外驗證：能寫出一個腳本，觀察前 10 個號碼後預測後續號碼**——這是 Demo 現場最有戲劇性的橋段，要能真的演出來。

### ⬜ T-304 植入 B 類設定與並行弱點（BE-11 ~ BE-15）
- **依賴**：T-303
- **內容**：敏感資料寫 Log、CORS 全開、原型鏈污染、開放重新導向、競爭條件。
- **DoD**：5 條植入完成。

### ⬜ T-305 植入 C 類前端弱點（FE-01 ~ FE-07）
- **依賴**：T-304
- **內容**：儲存型 XSS、DOM XSS、postMessage、noopener、前端判定 BINGO、localStorage JWT、註解掉 helmet。
- **DoD**：7 條植入完成；FE-01 可用 `<img src=x onerror=alert(1)>` 實際觸發。

### ⬜ T-306 植入 D 類授權弱點（AZ-01 ~ AZ-05）
- **依賴**：T-305
- **內容**：IDOR、大量賦值、JWT 驗證缺陷、Socket.IO 未驗權限、除錯端點。
- **DoD**：5 條植入完成；AZ-04 可實際演示「非房主也能抽號」。

### ⬜ T-307 植入 E 類相依套件弱點（DEP-01、DEP-02、DEP-05）
- **依賴**：T-306
- **內容**：降版 Node 與 Python 套件至含 advisory 的版本。
- **⚠️ 版本號必須當下到 GitHub Advisory Database 查證**，不可憑記憶填寫（見 `research.md` R-07、`plan.md` R11）。
- **DoD**：`npm install` / `pip install` 可成功；應用程式**仍能正常運作**（降版不能把遊戲弄壞）；記錄每個套件對應的 GHSA ID 到 `docs/VULN-CATALOG.md`。

### ⬜ T-308 植入 F 類基礎架構弱點（INF-01 ~ INF-07）
- **依賴**：T-307
- **內容**：Dockerfile、Bicep、Terraform、Actions workflow 弱點。
- **DoD**：7 條植入完成；`docker compose up` **仍能正常啟動**；CI **仍能跑完**（弱點不能讓 CI 掛掉，否則 Demo 進不了 Act 2）。

### ⬜ T-309 植入 G 類品質問題（CQ-01 ~ CQ-08）
- **依賴**：T-308
- **內容**：把 `engine.ts` 重構成 700 行 God Function；把賓果判定複製成三份且行為不一致；空 catch；魔術數字；移除測試；N+1；記憶體洩漏；命名混亂。
- **⚠️ CQ-02 的三份實作，行為差異必須「不影響正常玩」**——只在極端情況（例如同時完成兩條對角線）才不一致。否則違反 R10。
- **DoD**：8 條植入完成；遊戲**仍能正常玩完一局**。

### ⬜ T-310 建立 `.github/copilot-instructions.md`
- **依賴**：T-309
- **內容**：依 `plan.md` 13.7 撰寫安全規範。
- **DoD**：檔案就位；在 IDE 中實測 Copilot 產生的程式碼確實遵循這些規範（這是 Act 1 的 P4 橋段）。

### ⬜ T-311 建立 `docs/VULN-CATALOG.md`（含修復解答）
- **依賴**：T-309
- **內容**：58 條弱點的完整對照表，每條含：檔案位置、行號、CWE、攻擊 PoC、**正確的修復寫法**。
- **DoD**：58 條齊全；任何工程師照著這份文件可以獨立修好每一條。

### ⬜ T-312 全流程回歸測試
- **依賴**：T-311
- **內容**：植入 58 條弱點後，完整跑一次遊戲流程。
- **DoD**：三個瀏覽器同時玩完一局無異常；`docker compose up` 正常；CI 通過（除了刻意設計失敗的檢查）。

### 🚪 Phase 3 關卡檢查
- [ ] 58 條弱點全部植入，每條一個 commit
- [ ] 憑證第二人複核完成
- [ ] **遊戲仍然完全可玩**（R10 防線）
- [ ] 程式碼中無任何「這裡有漏洞」的註解
- [ ] `docs/VULN-CATALOG.md` 完整

---

## Phase 4 — GitHub 平台設定與驗證

> commit 前綴：`ci:` / `chore:`
> **本 Phase 的核心不是「設定」，是「驗證每個 alert 真的出現」。**

### 🚧 T-401 建立組織層級 Security Configuration（暫緩，改為 repo 層級手動啟用）
- **依賴**：T-001、Phase 3 完成
- **原內容**：依 `plan.md` 13.5 建立 `bingo-demo-baseline` 組織設定檔並套用到 repo。
- **🚧 暫緩原因**：Security Configuration 是組織層級功能，現有帳號無權限。
- **替代做法**：到 repo 的 **Settings → Code security** 逐項手動啟用 `plan.md` 13.5 表格中的每一項
  （Secret Scanning、Push Protection、Validity Checks、AI 通用密碼偵測、Code Scanning、
  Dependabot Alerts、Dependabot Security Updates、Private Vulnerability Reporting）。
- **DoD**：repo 的 Security 頁籤顯示上述功能全部已啟用（逐一截圖存證，供日後轉移組織時比對）。

### ⬜ T-402 啟用 Secret Scanning 並驗證存量 alert
- **依賴**：T-401
- **內容**：啟用後等待掃描完成，逐一比對 SEC-01 ~ SEC-11 是否都產生 alert。
- **DoD**：**≥ 9 個** alert；SEC-05（歷史洩漏）與 SEC-10（AI 通用密碼）各至少 1 個；未觸發的條目要換寫法重試，記錄在 `research.md`。

### ⬜ T-403 驗證 Validity Check 全數無效
- **依賴**：T-402
- **內容**：檢查每個 secret alert 的 validity 狀態。
- **DoD**：**沒有任何一個 alert 顯示為 Active/Valid**。若有，立即當作資安事件處理並輪替該憑證。
- **⚠️ 阻斷性任務。此項未過，專案不得繼續。**

### ⬜ T-404 建立自訂 Secret Scanning Pattern 並 dry run
- **依賴**：T-402
- **內容**：依 `plan.md` 13.6 建立 pattern，先在 repo 層級 dry run，確認能命中 SEC-08 且無誤報後才發布，再啟用 push protection。
- **❓ 待驗證**：公開 repo 上使用**自訂 pattern** 是否需要 Secret Protection 授權（`plan.md` 3.6 節 ❓ 表格）。
  若不可用，S3 橋段改為口述 + 截圖，並把時間補進 Act 1 的歷史洩漏掃描段落。
- **DoD**：dry run 命中 SEC-08；發布後產生 alert；push protection 已對此 pattern 啟用。
  若確認不可用，在 `plan.md` 3.6 節與 `research.md` 記錄結論。

### ⬜ T-405 啟用 Push Protection 並實測阻擋
- **依賴**：T-404
- **內容**：啟用後，實際建立 `demo/act1-leak-key` 分支，把一個 Azure OpenAI Key 加入 `config/azure.ts` 並 push。
- **DoD**：**push 被擋下，且錯誤訊息清楚可讀**（這是 Act 1 的高潮畫面，要截圖存檔）。重複測試 3 次都要被擋。
- **⚠️ 這是整場 Demo 最重要的一個畫面。**

### ⬜ T-406 建立 CodeQL Workflow 並驗證 alert
- **依賴**：T-401
- **內容**：依 `plan.md` 13.1 建立 workflow 與 config。**先跑一次 `security` suite，再跑一次 `security-extended`，比對 alert 數量差異並記錄**（這個差異本身是 Demo 素材）。
- **DoD**：**≥ 20 個** alert；涵蓋 `javascript-typescript` 與 `python`；BE-01（SQLi）、FE-01（XSS）、BE-02（Command Injection）、BE-03（Path Traversal）必須在列。未觸發的弱點要換寫法。

### ⬜ T-407 驗證 Copilot Autofix 可用性
- **依賴**：T-406
- **內容**：對 BE-01、FE-01、BE-03、BE-07、BE-13、AZ-03 逐一點開 Autofix，記錄實際產出的修復內容與品質。
- **❓ 併入驗證 C5**：測試**批次指派多個 alert 給 Copilot** 是否需要組織層級的 security campaign。
  Campaign 已確定不可用；若 code scanning backlog 的批次路徑也不可用，
  Act 2 收尾改為「單一 alert 指派給 Copilot」，主持稿需備兩套講法（`plan.md` 3.6 節）。
- **DoD**：**≥ 6 個** alert 能產生合理修復；每個的實際輸出截圖存檔（供 Phase 5 主持稿使用，也作為 R5 的準備）；
  C5 的可用性有明確結論並回填 `plan.md` 3.6 節。

### ⬜ T-408 建立 Dependabot 設定並驗證 alert
- **依賴**：T-401、T-307
- **內容**：依 `plan.md` 13.3 建立 `dependabot.yml`。
- **DoD**：**≥ 8 個** alert，含 **≥ 2 個 Critical**；至少 3 個有自動修復 PR。

### ⬜ T-409 建立 Dependency Review 並實測阻擋
- **依賴**：T-408
- **內容**：依 `plan.md` 13.2 建立 workflow；建立 `demo/act2-new-feature` 分支的 PR，其中加入含 CVE 的套件 + 一個 LGPL 套件。
- **DoD**：PR 上的 Dependency Review 檢查失敗，且 PR 留言清楚列出被擋原因（含授權違規）。截圖存檔。

### ⬜ T-410 建立 Ruleset、CODEOWNERS 與 PR 模板
- **依賴**：T-406、T-409
- **內容**：依 `plan.md` 13.4 設定；CODEOWNERS 讓 `infra/` 需資安團隊核准。
- **DoD**：`demo/act2-new-feature` 的 PR **確實無法合併**，且畫面上清楚顯示卡在哪些檢查。

### ⬜ T-411 撰寫 `scripts/verify-alerts.sh`
- **依賴**：T-402、T-406、T-408
- **內容**：用 GitHub REST API 查詢各類 alert 數量，與 `plan.md` 第 16 節的門檻比對，不符就以非零狀態碼退出。
- **DoD**：腳本執行全綠；納入排程每週執行（因應 R11：advisory 會隨時間變動）。

### 🚪 Phase 4 關卡檢查（M2 里程碑）
- [ ] Secret alert ≥ 9、CodeQL alert ≥ 20、Dependabot alert ≥ 8
- [ ] **Validity Check 全數無效**（阻斷性）
- [ ] Push Protection 連續 3 次實測都被擋下
- [ ] Autofix 可用數 ≥ 6
- [ ] `verify-alerts.sh` 全綠
- [ ] 🚧 T-401 已改用 repo 層級手動啟用，並截圖存證
- [ ] ❓ C5（批次指派 Copilot）與 S3（自訂 pattern）的可用性已實測並回填 `plan.md` 3.6 節
- [ ] **建立 tag `demo-baseline-v1`**

---

## Phase 5 — Demo 資產

> commit 前綴：`docs:` / `chore:`

### ⬜ T-501 撰寫 `docs/DEMO-SCRIPT.md`（45 分鐘兩幕版）
- **依賴**：Phase 4 完成
- **內容**：依 `plan.md` 4.4 的六項要求，為 **4.1b 兩幕版**的每個橋段撰寫逐字稿、操作步驟、預期畫面、痛點對應句、常見提問、Plan B。
- **🚧 注意**：Act 3 暫緩，**不要寫**組織層級的橋段。改為納入：
  - 給 CISO 受眾的補償話術（把「需要組織層級授權」轉成銷售論點，見 `plan.md` 4.1b）
  - C5 兩套講法（批次指派 / 單一指派），依 T-407 的實測結果擇一為主、另一為備案
- **DoD**：一位**非工程背景**的同仁照著唸與操作，能完整走完全程。

### ⬜ T-502 撰寫 30 分鐘與 15 分鐘版本
- **依賴**：T-501
- **內容**：30 分鐘版依 `plan.md` 4.2（已移除 Security Overview 段落）；15 分鐘攤位版依 4.3（不受影響）。
- **DoD**：兩個版本各自計時實測，誤差在 ±3 分鐘內。

### ⬜ T-503 撰寫 `scripts/reset-demo.sh`
- **依賴**：Phase 4 完成
- **內容**：依 `plan.md` 14.2 的五個步驟實作。
- **DoD**：完整執行一次後，`verify-alerts.sh` 全綠，且耗時 **< 5 分鐘**。

### ⬜ T-504 建立 Template Repository 流程
- **依賴**：T-503
- **內容**：將 repo 設為 Template；撰寫「每場 Demo 從範本開新 repo」的操作步驟（`plan.md` 14.2 建議的做法）。**Template Repository 個人帳號同樣支援，不受組織權限限制。**
- **DoD**：實測從範本開一個新 repo，套用 Security Configuration 後，所有 alert 在 15 分鐘內重新出現。

### ⬜ T-505 截圖包
- **依賴**：T-501
- **內容**：每個橋段的關鍵畫面截圖，特別是 Push Protection 阻擋、Autofix 產出、Security Overview 儀表板、Security Campaign。
- **DoD**：截圖齊全，可在網路中斷時直接當投影片用。

### ⬜ T-506 備援錄影
- **依賴**：T-501
- **內容**：錄製 60 分鐘完整版全程（含旁白）。
- **DoD**：影片可播放；分段標記各幕時間點，方便跳播。

### ⬜ T-507 客戶 Handout
- **依賴**：T-501
- **內容**：一頁式摘要：本次展示的 GitHub 能力清單、對應客戶痛點、導入路徑、授權方式。
- **DoD**：一頁 A4，可直接列印或寄出。

### ⬜ T-508 撰寫 `docs/GHAS-SETUP.md`
- **依賴**：Phase 4 完成
- **內容**：把 Phase 4 做過的所有 GitHub 設定寫成可重複執行的步驟清單。
- **DoD**：另一位工程師照著做，能在新 repo 上重現完全相同的設定。

### 🚪 Phase 5 關卡檢查（M3 里程碑）
- [ ] 三個長度版本的主持稿完成
- [ ] `reset-demo.sh` < 5 分鐘
- [ ] 備援錄影與截圖包就位

---

## Phase 6 — 彩排

> commit 前綴：`docs:` / `fix:`

### ⬜ T-601 第一次完整彩排（工程師主持）
- **依賴**：Phase 5 完成
- **DoD**：全程計時；記錄所有卡頓、失敗、超時的環節到彩排紀錄。

### ⬜ T-602 修正第一次彩排發現的問題
- **依賴**：T-601
- **DoD**：彩排紀錄中的問題全部關閉或標記為「已知限制 + Plan B」。

### ⬜ T-603 第二次彩排（非工程背景同仁主持）
- **依賴**：T-602
- **內容**：驗證主持稿的可用性——這才是真正的測試。
- **DoD**：主持人**未求助工程師**即完成全程；記錄所有需要求助的時刻並修正主持稿。

### ⬜ T-604 斷網演練
- **依賴**：T-603
- **內容**：模擬三種故障：完全斷網、github.com 被擋、Azure 服務逾時。
- **DoD**：三種情況都有可執行的 Plan B，且已實測。

### ⬜ T-605 第三次彩排（找同事當假客戶提問）
- **依賴**：T-604
- **內容**：安排 2–3 位同事扮演 CISO / 開發主管 / 採購，全程提問刁難。
- **DoD**：所有問題都有答案，未能回答的整理進主持稿的「常見提問」章節。

### 🚪 Phase 6 關卡檢查
- [ ] 3 次完整彩排全部完成
- [ ] 非工程背景同仁可獨立主持
- [ ] 三種故障情境都有實測過的 Plan B

---

## Phase 7 — 交付

> commit 前綴：`docs:`

### ⬜ T-701 售前團隊 Enablement 教學
- **依賴**：Phase 6 完成
- **DoD**：教學完成；至少 2 位售前同仁可獨立執行 Demo。

### ⬜ T-702 建立 Demo 預約與重置流程
- **依賴**：T-701
- **內容**：誰要用、怎麼開新 repo、用完誰負責刪除。
- **DoD**：流程文件化；負責人指定完成。

### ⬜ T-703 建立每週 `verify-alerts.sh` 排程
- **依賴**：T-411
- **內容**：因應 R11，advisory 會隨時間變動導致 alert 數量下降。
- **DoD**：排程建立；失敗時會通知負責人。

### ⬜ T-704 專案回顧與文件封存
- **依賴**：T-703
- **內容**：更新 `plan.md` 記錄實際與計畫的差異；封存彩排紀錄。
- **DoD**：`plan.md` 狀態更新為「已交付」。

### 🚪 Phase 7 關卡檢查（M4 里程碑）
- [ ] 售前團隊可獨立執行
- [ ] 重置流程與負責人明確
- [ ] 每週健康檢查排程運作中

---

## 附錄：跨 Phase 的持續性規則

1. **每完成一個任務就 commit**，訊息前綴依各 Phase 說明。
2. **不要為了趕進度跳過 DoD**。特別是 Phase 4 的驗證任務——設定好不等於 alert 會出現。
3. **遊戲可玩性是最高優先**（R10）。任何弱點植入若破壞遊戲流程，改寫法而不是留著。
4. **憑證合規紅線不可妥協**（R1）。T-403 未通過，專案停止。
5. **弱點對應關係只寫在文件，不寫在程式碼**（`plan.md` 12.1）。
6. 遇到 `plan.md` 沒寫清楚的決策點，**先問，不要自己發明**。
