# BingoBlitz — GitHub Advanced Security Demo

> ## ⚠️ 警告：本專案刻意內含資安弱點
>
> 這是一套**行銷／售前 Live Demo 資產**，程式碼中的漏洞、弱點與機敏資訊洩漏皆為**刻意設計**，
> 用來展示 GitHub Copilot 與 GitHub Advanced Security 的偵測與修復能力。
>
> **嚴禁**將本專案的任何程式碼複製到正式環境，或部署至可公開存取的位置。
> 所有 API Key、連線字串與 Token 皆為**格式正確但無效的合成值**，不對應任何真實資源。

## 專案文件

| 文件 | 內容 | 狀態 |
|---|---|---|
| [docs/plan.md](docs/plan.md) | **專案計畫書（唯一權威）**——目標、架構、API 契約、弱點植入規格、Demo 劇本、時程 | ✅ |
| [docs/tasks.md](docs/tasks.md) | **任務拆解**——68 個任務、依賴關係、完成定義、Phase 關卡 | ✅ |
| [docs/research.md](docs/research.md) | **技術研究與查證紀錄**——GitHub 官方文件依據、待確認開放問題 | ✅ |
| [docs/SECURITY-DEMO-NOTICE.md](docs/SECURITY-DEMO-NOTICE.md) | 免責聲明與使用限制 | ✅ |
| docs/VULN-CATALOG.md | 弱點對照詳細版（含修復解答） | ⬜ T-311 |
| docs/DEMO-SCRIPT.md | Demo 主持稿逐字稿 | ⬜ T-501 |
| docs/GHAS-SETUP.md | GitHub 平台設定步驟 | ⬜ T-508 |
| docs/AZURE-SETUP.md | Azure 資源佈建步驟 | ⬜ T-003 |

## 現況

**Phase 0：前置準備** — 計畫已完成，等待核准與 [plan.md 第 18 節](docs/plan.md#18-待確認事項) 的 7 個待確認事項有答案後開工。

## 給接手實作的人

閱讀順序：`docs/plan.md` → `docs/research.md` → `docs/tasks.md`，然後從 `tasks.md` 的 **T-001** 開始。
