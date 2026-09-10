# BingoBlitz — 憑證合規與安全展示檢查清單 (COMPLIANCE-CHECKLIST.md)

> 對應任務：**T-005**
> 核心原則：**本專案絕對嚴禁使用任何真實憑證，所有 Key 必須為合成值（Synthetic Tokens）或官方公有範例值。**

---

## 1. 憑證生成規範與格式準則

所有在 Phase 3 植入的 A 類（Secrets）弱點，必須符合以下規範：

| 識別項 | 類型 | 格式規範 | 說明 |
|---|---|---|---|
| SEC-01 | Azure OpenAI API Key | 32 碼十六進位英數字，例如 `32a1b9c8d7e6f5041234567890abcdef` | 格式正確，但對應非真實端點或無效金鑰 |
| SEC-02 | Azure Storage 連線字串 | `DefaultEndpointsProtocol=https;AccountName=demostoragefake;AccountKey=fakebase64key==;EndpointSuffix=core.windows.net` | 帳號與金鑰皆為合成假值 |
| SEC-03 | Terraform Service Principal | Client ID 為隨機 GUID，Secret 為合成值 | 假 GUID 與非真實密鑰 |
| SEC-04 | Azure Maps Key | 格式符合 Azure Maps 官方文檔中公開的 EXAMPLE Key | 公開範例值 |
| SEC-05 | 歷史刪除 Secrets | 包含假連線字串的 JSON 格式 | 僅於 Git 歷史演習用 |
| SEC-06 | GitHub PAT 範例 | `ghp_` 開頭接 36 碼假英數字元 | 無效的合成 PAT |
| SEC-07 | ACS 連線字串 | `endpoint=https://fake-acs.communication.azure.com/;accesskey=fakebase64==` | 假端點與金鑰 |
| SEC-08 | 自訂內部授權 Token | `BINGO_SK_live_` 開頭接 32 碼隨機英數字 | 專案特有的自訂格式 Pattern |
| SEC-09 | JWT 弱密鑰 | `"bingo-secret-2024"` | 刻意設計之弱字串 |
| SEC-10 | 資料庫密碼 | `"Sup3rS3cret!Bingo"` | 刻意硬編碼的常見弱密碼 |

---

## 2. 複核流程 (Second-Person Review)

在提交任何包含機敏字串植入的 Commit（特別是 Phase 3）之前：
1. **靜態驗證**：確認字串完全屬於上述合成清單或官方 docs 範例，絕非任何工程師私有或測試環境的真實 token。
2. **連線驗證（Validity Checks）**：在 GitHub 上觀察 Secret Scanning 的 Validity Checks，狀態必須顯示為 `inactive`、`revoked` 或 `cannot be verified`，絕對不允許出現 `valid` 或 `active`。
3. **複核紀錄**：由第二人或資安負責人核對簽名後方可推送到遠端分支。
