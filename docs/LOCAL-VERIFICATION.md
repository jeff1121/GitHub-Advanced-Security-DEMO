# 本地驗證紀錄

日期：2026-09-11。不沿用舊版的完成宣稱；本地與雲端結果分開記錄。使用者已追加授權雲端設定／驗收，並複核本次合成值生成方式。

## 已完成的雲端驗證

- Secret Scanning、Repo Push Protection、Dependabot Security Updates 已透過 API 啟用並讀回確認。
- 已發布不含測試值的 `demo/act1-leak-key` 起點：`5ebbb43f303c6cc613e8fca43f0a72cbf8af90b2`。
- 在独立測試副本，由本機亂數生成 Azure 格式 fixture（未使用任何既有憑證）。測試 commit `cc57565b892f25782ab81c749209b6580b75b88d` 的 push 連續三次被 GitHub 拒絕：`GH013`、`GITHUB PUSH PROTECTION`、`Azure Storage Account Access Key`，定位 `demo-fixtures/azure-sample.ts:4`。
- **沒有 bypass，測試 commit 未被遠端接收。** 遠端 branch SHA 仍為 `5ebbb43`。此結果證明本次 Azure Storage 場景被擋，不代表 Azure OpenAI 格式也已驗證命中。
- 被阻擋的 push 不會啟動該 commit 的 Actions。其他掃描與修復 PR 驗收另列，不以此成功取代。

## 已執行

| 項目 | 指令／方法 | 實際結果 |
|---|---|---|
| 工具腳本語法 | `bash -n scripts/seed.sh scripts/init-local-env.sh scripts/demo-preflight.sh`；`node --check scripts/seed.cjs` | 通過 |
| 本地環境與 seed 防護測試 | `node --test scripts/local-tools.test.cjs` | 4 項通過：預設 dry-run、檔案 0600、不印憑證／不覆寫、未忽略 .env 拒絕、缺 DB 設定 seed 失敗 |
| Workflow 基本結構 | Python YAML BaseLoader；檢查 jobs、on、所有 uses 為 40 字元 SHA、無 pull_request_target | CI、CodeQL、Dependency Review 三份通過；不是完整 Actions 語義驗證 |
| Action 固定版本 | `git ls-remote` 官方 Action repo | checkout v4、setup-node v4、setup-python v5、CodeQL v4、upload-artifact v4 解析到 SHA；dependency-review 使用明確 v4.9.0 SHA（v4 浮動 ref 查詢沒有結果） |
| CodeQL CLI | `codeql version --format=json`；`codeql resolve languages --format=json` | 本機 CLI 2.25.0，包含 JS/Python/Actions extractor |
| CodeQL query pack | `codeql pack download codeql/actions-queries` | **失敗**：最新 0.6.35 manifest 含 CLI 2.25.0 無法解析的 `digest` 欄位，manifest 指向 CLI 2.27.0；未執行分析、沒有 SARIF 或警報數量 |

## 尚未完成

- 安全基準修復後的全套 build、lint、測試、實際 coverage。
- 五容器健康狀態、migration、seed 數量與冪等性。
- 三個瀏覽器身份完整遊戲與手機尺寸操作。
- 本地展示分支、弱點對照與掃描實測。
- 所有雲端 runs、alerts、PR 門禁、Push Protection、Copilot Review、Autofix。

CodeQL pack 的失敗需用相容的 CLI／query pack 組合另行解決，不應把 YAML 檢查通過當成 CodeQL 分析成功。舊版 `clean-baseline` tag 仍保留，不表示它已通過以上驗收。
