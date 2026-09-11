# BingoBlitz — GitHub Advanced Security Demo

> ## ⚠️ 資安展示專案，禁止正式使用或公開部署
>
> 本專案規劃刻意含弱點的展示版本，用於展示 GitHub Copilot 與 GitHub 安全功能。
> **禁止**將程式碼複製到正式環境，或部署至公開網路。不得將任何真實憑證、個資或客戶資料放進 repo。
> 合成測試值需具備來源與複核紀錄；格式相符不保證能觸發 GitHub 偵測。

## 現況（2026-09-11）

**目前正在修復本地基準，不是已驗證可用的完整 GHAS Demo。**

- **Phase 0：部分確認**。個人公開 repo、無組織權限已確認；Copilot 方案、Azure 訂閱、客戶產業、主持稿語言、投影片需求及憑證複核者仍有待確認事項。
- **Phase 1／2：部分實作，修復與重新驗收中**。先前的「全部完成／M1 達成／100% 覆蓋率」缺少相應證據，已撤回；完成標記須依原始 DoD 與實際測試回填。
- **Phase 3：58 項弱點目錄仍為完整專案的待辦範圍**。代表性場景就緒不代表 58 項已完成。
- **雲端驗證未完成**。本輪使用者選擇「先完成本地版本」：不 push 新增弱點、不建立遠端 PR、不變更 GitHub 設定，也不公開部署。

`main` 最終規劃作為弱點展示基準，`solution/hardened` 作為安全對照；兩者原先同指 `f5dbda6`，該 commit 與 `clean-baseline` tag 不是安全認證。分支名稱存在不代表所述場景已實作。當前操作狀態請看[分支小抄](docs/DEMO-CHEATSHEET.md)。

本地修復採用 **Node.js 22（至少 22.12）與 React 19**，配合目前工具鏈的執行需求；原規格的 Node.js 20 不再作為本輪執行基準。建置、容器與瀏覽器仍需以本輪實際驗收結果為準。

> 組織層級 Act 3 暫緩，保留兩幕版目標。Act 1／2 的實際可用能力仍需逐項驗證，不能由公開 repo 推論每項授權與平台功能皆已可用。

## 專案文件

| 文件 | 用途／狀態 |
|---|---|
| [docs/plan.md](docs/plan.md) | 權威計畫、架構、原始驗收目標及未確認事項 |
| [docs/tasks.md](docs/tasks.md) | 68 個任務與 DoD；未實測項目保持待驗證 |
| [docs/research.md](docs/research.md) | 研究來源；平台設定與授權須按當下環境重查 |
| [docs/DEMO-CHEATSHEET.md](docs/DEMO-CHEATSHEET.md) | 本地與日後雲端場景的分支操作狀態 |
| [docs/GHAS-SETUP.md](docs/GHAS-SETUP.md) | 平台設定與驗證清單；非雲端已完成紀錄 |
| [docs/AZURE-SETUP.md](docs/AZURE-SETUP.md) | Mock 開發預設與尚待確認的訂閱／整合事項 |
| [docs/COMPLIANCE-CHECKLIST.md](docs/COMPLIANCE-CHECKLIST.md) | 合成憑證複核流程草案，不含 token 清單 |
| [docs/SECURITY-DEMO-NOTICE.md](docs/SECURITY-DEMO-NOTICE.md) | 展示限制與安全聲明 |

弱點完整對照表（T-311）、主持稿（T-501）、實際警報數字與雲端 Run／PR 證據均須逐項產出並驗收，不以文件存在代替實測。
