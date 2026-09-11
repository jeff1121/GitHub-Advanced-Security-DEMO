# BingoBlitz 分支操作小抄

> **2026-09-11：本地準備中，尚非可直接使用的雲端 Demo。**
> 本輪不 push、不開遠端 PR、不更改 GitHub 設定。以下區分目前狀態與目標流程；不存在的分支不能直接 checkout。

## 分支角色

| 分支 | 用途 | 目前狀態 |
|---|---|---|
| `fix/local-demo-foundation` | 修復可玩性、安全基準與準備 pipeline | 本地開發中 |
| `solution/hardened` | 安全程式碼對照 | 已存在；舊版仍有缺陷，待修正與驗收，不代表完全安全 |
| `main` | 最終弱點展示基準 | 已存在；目前與遠端 hardened 同為舊版，尚未完成展示弱點分化 |
| `demo/act1-leak-key` | 從無秘密起點加入合成測試值 | 尚未準備完成；雲端阻擋待實測 |
| `demo/act2-new-feature` | 相對 main 的新增問題與 PR 修復演練 | 尚未準備完成；雲端 PR 待另行授權 |

## 先記住這四件事

1. **push 到 main：** 配置完成後可觸發 CI、CodeQL。一般 build/test 成功與產生安全警報可以同時發生。
2. **PR 到 main：** Dependency Review 檢查新增相依差異；Copilot Review 需可用方案及手動請求或自動審查設定。不是每次 push 自動發生。
3. **Push Protection：** 在 GitHub 接受 push 前阻擋；被擋的 commit 不會啟動 Actions。合成 Key 不一定匹配，不能保證攔截。禁止用真實憑證、繞過保護或本地假錯誤冒充阻擋。
4. **切換 hardened：** 用來比較程式碼和執行結果，不會清空 repo 的 Secret Scanning／Dependabot 警報。Autofix 是 AI 建議，仍須 review 與測試，不能保證自動修復或合併。

## 本地準備工具

在 repo 根目錄執行（不需要推送）：

```bash
bash scripts/demo-preflight.sh        # 列出存在的分支與缺項；不齊全會非零退出
bash scripts/init-local-env.sh        # 預設 dry-run，不建立任何秘密
node --test scripts/local-tools.test.cjs
bash scripts/plant-secret.sh          # 僅說明合成 fixture 的準備流程，不植入、不 commit、不 push
```

`init-local-env.sh --apply` 可建立 Git 忽略的本地 `.env`，不覆寫既有檔案且不印出憑證。
CI、CodeQL、Dependency Review 與 Dependabot 設定檔已在本地準備；測試結果與限制见 [LOCAL-VERIFICATION.md](LOCAL-VERIFICATION.md)。

## 本輪可做與不可做

- 可做：本地開發、測試、branch diff、隔離環境演練；檢視既有遠端設定。
- 不做：push、新建雲端 PR、變更 Ruleset、啟用／關閉安全服務、公開部署。
- `clean-baseline` 是原始快照，不是驗證通過的安全認證；不移動舊 tag。
- 原小抄的「40+ CodeQL／11 Secret／10+ Dependabot」不是實測數字，已撤回。
- 原 `reset-demo.sh` 未存在／未驗收前，不應執行該指令。

## 日後雲端演練順序（目前不可視為已驗證操作）

先確認新分支已獲授權發布、掃描設定與 Copilot 可用性，再依序：

1. 在 main 做一般變更，觀察 CI 執行與掃描結果。
2. 在 act1 的無秘密起點植入**經第二人複核**的合成測試值，commit 後嘗試 push，記錄實際結果；若未擋，不宣稱成功。
3. 在 act2 建立針對 main 的 PR，觀察新增問題、Dependency Review 與適當門禁；請求 Copilot Review，對支援的 alert 示範 Autofix。
4. 用 hardened 比較安全寫法；展示測试與分支篩選後的掃描證據，不宣稱 repo 零警告。

若 main 已要求所有變更經 PR，第一步也必須改走 PR；不能為了直接 push 繞過保護。
