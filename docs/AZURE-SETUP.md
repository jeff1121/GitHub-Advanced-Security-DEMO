# BingoBlitz — Azure 與 Mock 模式準備

> **2026-09-11：本地修復中；T-003 尚未完成。** Azure 訂閱是否可用仍待使用者確認。
> 本輪僅準備本地版本，不部署 Azure、不提交真實憑證、不變更雲端設定。

## 本地實作預設

`MOCK_AZURE=true` 是目前的本地開發預設，**不是「使用者已確認沒有 Azure 訂閱」的決策**。Mock 可降低本地遊戲對雲端網路與費用的依賴；全流程可玩性仍須實測。

| 服務 | Mock 規格 | 尚待驗證／實作 |
|---|---|---|
| Azure OpenAI | 從本地 20 句報號詞選句 | 引擎確實使用報號服務、逾時與失敗處理 |
| Blob Storage | 儲存於本機隔離的 `.data/blobs/` | 上傳格式、路徑防護、讀取及戰報流程 |
| Web PubSub | 使用本地 Socket.IO 房間廣播 | 多用戶同步與重連；不代表雲端水平擴展已完成 |
| Communication Services | 本地模擬 Email／SMS，不實際寄送 | 邀請路由與輸入／速率限制 |
| Key Vault | 尚未實作 | 不得將本地環境變數讀取描述為 Key Vault／OIDC 整合 |

尚未完成的真實服務路徑應明確回報不支援，不能回傳假成功。`MOCK_AZURE=false` 不是已驗收的真實 Azure 部署方式。

## 與 Secret Scanning／Push Protection 的關係

是否使用 Mock 與 GitHub 是否能辨識提交內容是兩個不同問題。本地程式不呼叫 Azure，仍可準備合成測試值，但**合成值不保證匹配 GitHub 支援的 pattern，也不保證觸發 Push Protection**。

- GitHub 的偵測與攔截受 token 類型、支援的 pattern、功能設定與實際推送內容影響。
- 不使用真實、已輪替或測試帳號的 Key 來換取「一定會被擋」的效果。
- 在雲端測試獲得另行授權前，只能標記「待雲端驗證」。本地字串匹配不是 GitHub 攔截的證據。
- 合成憑證來源與第二人複核流程見 [COMPLIANCE-CHECKLIST.md](COMPLIANCE-CHECKLIST.md)。

## T-003 完成前需要的資料

- [ ] 使用者確認 Azure 訂閱可用性與實際展示模式。
- [ ] Mock 模式下完整多人遊戲已實測，記錄 commit 與測試結果。
- [ ] 如需要真實 Azure，另行確認資源範圍、授權與費用；完成服務整合、設定驗證及隔離部署測試。
- [ ] 將實際決策回填 `plan.md` 第 18 節，不以開發預設代替使用者答案。
