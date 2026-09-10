# BingoBlitz — Azure 資源與 Mock 模式設定手冊 (AZURE-SETUP.md)

> 本文件記錄 BingoBlitz 的 Azure 整合架構、Mock 模式決策，以及若需串接真實 Azure 資源時的佈建規格。
> 對應任務：**T-003**。

---

## 1. 核心決策：預設全面採用 Mock 模式

為了確保 Live Demo **零雲端費用、隨時隨地可離線展示、且免受雲端配額與網路延遲干擾**，本專案預設啟用：

```bash
MOCK_AZURE=true
```

### Mock 模式行為規格

| 服務項目 | 在遊戲中的用途 | `MOCK_AZURE=true` 時的行為 |
|---|---|---|
| **Azure OpenAI** | AI 報號主持人、聊天室幽默評述 | 從預先撰寫的 20 句本地報號詞隨機挑選，模擬延遲 300ms 回傳 |
| **Azure Blob Storage** | 玩家自訂頭像、賽後戰報圖儲存 | 存取本機磁碟 `./.data/blobs/` 目錄，提供靜態檔案服務 |
| **Azure Web PubSub** | 即時抽號與房間訊息水平擴展 | 直接由本地 Node.js 內部 Socket.IO 伺服器進行房間廣播 |
| **Azure Communication Services** | Email / SMS 邀請玩家 | 將信件與簡訊內容格式化輸出至後端 stdout / 終端機日誌 |
| **Azure Key Vault** | `solution/hardened` 分支示範無密碼安全架構 | 在 Mock 模式下模擬安全取得憑證之介面 |

### 💡 重要說明：Secret Scanning 與 Push Protection 完全不受 Mock 影響！
GitHub Advanced Security 的 **Secret Scanning** 與 **Push Protection** 是在 Git 推送與提交歷史中，透過**字串正規表示式（Regex）、熵值分析（Entropy）與合作夥伴特徵碼**進行靜態辨識。
因此，即使程式碼內部走 `MOCK_AZURE=true` 本機模擬邏輯，只要設定檔或程式碼中出現符合特徵的 Azure 連線字串或 Key（如 `DefaultEndpointsProtocol=https;AccountName=...` 或合成的 32 碼 OpenAI Key），**GitHub 依然會 100% 準確觸發 Push Protection 阻擋與 Secret Alert！**

---

## 2. 真實 Azure 資源佈建規格（選配）

若未來有真實連線展示需求，可依下述規格透過 Azure CLI 或 Bicep 進行佈建：

### 2.1 必要資源清單
1. **Azure OpenAI Service**:
   - 模型部署：`gpt-4o-mini`
   - Deployment Name：`gpt-4o-mini`
2. **Azure Storage Account**:
   - 類型：Standard General Purpose v2 (LRS)
   - Blob 容器：`avatars`、`reports`
3. **Azure Web PubSub**:
   - 定價層：Free 或 Standard
   - Hub 名稱：`bingo`
4. **Azure Communication Services**:
   - 啟用 Email 與電話 SMS 功能（選配）
5. **Azure Key Vault**:
   - 用於 `solution/hardened` 分支存放機敏設定

### 2.2 真實環境變數切換
若切換為真實 Azure，僅需將 `.env` 的 `MOCK_AZURE` 設為 `false` 並填入對應連線參數：
```bash
MOCK_AZURE=false
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<real-or-test-key>
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_WEBPUBSUB_CONNECTION_STRING=Endpoint=https://...;AccessKey=...
ACS_CONNECTION_STRING=endpoint=https://...;accesskey=...
AZURE_KEY_VAULT_URI=https://<your-vault>.vault.azure.net/
```
