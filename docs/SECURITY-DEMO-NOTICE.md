# 資安展示用途聲明 (Security Demo Notice)

## 本專案的性質

本 Repository 是為了展示 GitHub Copilot 與 GitHub Advanced Security
（GitHub Secret Protection / GitHub Code Security）的能力而建立的**教育與行銷展示用專案**。

程式碼中包含**刻意植入**的資安弱點，完整清單見
[PROJECT-PLAN.md 第 6 節：弱點目錄](PROJECT-PLAN.md#6-弱點目錄-vuln-catalog)。

## 使用限制

1. **禁止**將本專案的程式碼片段複製到任何正式或測試環境。
2. **禁止**將本專案部署至可公開存取的網際網路位置。
3. **禁止**在本專案中放入任何真實憑證、真實個資或客戶資料。
4. Repository 應維持 Private 或 Internal 可見性。

## 關於憑證

本專案中所有出現的 API Key、連線字串、Token、密碼皆為：

- **格式正確但無效**的合成值，或
- 各雲端服務供應商官方文件中公開的 EXAMPLE 值。

這些值**不對應任何真實資源**，無法用於存取任何系統。
任何人若發現本專案中存在疑似真實憑證，請立即回報專案負責人。

## 回報

發現問題請聯絡專案負責人，或依 Repository 的私密弱點回報流程提出。
