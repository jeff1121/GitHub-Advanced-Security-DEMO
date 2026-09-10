# BingoBlitz — Demo 分支與實機操作小抄 (DEMO-CHEATSHEET.md)

> 專為 Demo 主持人準備的一頁式快速指引。在客戶會議前打開本檔案即可快速確認要切換的分支與操作時機。

---

## 快速查閱表：我現在該在哪個 Branch？

| 演示階段 | 演示目的 | 使用分支 / 操作 | 核心展示亮點 |
|---|---|---|---|
| **開場暖身 (0~5 分鐘)** | 讓客戶掃 QR Code 一起玩一局賓果 | `main` (本地或展示環境執行) | 手機掃碼秒加入、抽號、即時連線喊 BINGO |
| **Act 1：既有存量弱點** | 展示「專案接上 GitHub，既有弱點全抓出」 | **`main` 的 GitHub 網頁** → 點開 **Security** 頁籤 | • **40+ 個 CodeQL 弱點**<br>• **11 個 Secret 洩漏**（含自訂授權 Token）<br>• **10+ 個 Dependabot 警報** |
| **Act 1：Push Protection** | 展示「工程師不小心把 Key 寫進程式碼，Push 當場被擋下」 | 本地切換到 **`demo/act1-leak-key`**<br>執行 `git push origin demo/act1-leak-key` | ⭐ **GitHub 當場在終端機噴紅字拒絕 Push**！完全上不了雲端 |
| **Act 2：PR 品質關卡與 Autofix** | 展示「Pull Request 上的自動安全檢查與 AI 一鍵修復」 | 在 GitHub 網頁上發起 PR：<br>**`demo/act2-new-feature` ➔ `main`** | ⭐ **CodeQL Check 失敗阻擋合併**<br>⭐ 點擊 **Copilot Autofix** 一鍵產生安全修復程式碼<br>⭐ **Dependency Review** 抓到惡意與授權不合規套件 |
| **收尾／客戶提問** | 「那如果完全依照最佳實踐，修復好的完整程式長怎樣？」 | 切換至 **`solution/hardened`** 分支 | • 連線改用 **Azure Key Vault** 無密碼驗證<br>• 資料庫查詢全面參數化<br>• Socket.IO 嚴格驗證呼叫者權限<br>• Security 頁籤零警告全綠燈 |

---

## 常用切換指令速記

```bash
# 1. 回到弱點基準主戰場（一般 Demo 預設在此）
git checkout main

# 2. 演練 Push Protection 阻擋
git checkout demo/act1-leak-key
git push origin demo/act1-leak-key   # 預期結果：被 GitHub Push Protection 擋下！

# 3. 查看完全修復後的黃金標準版本
git checkout solution/hardened

# 4. Demo 結束後一鍵重置（恢復至未演出的初始狀態）
./scripts/reset-demo.sh
```
