# GitHub 展示設定與驗證清單

> 本輪是本地準備。沒有授權建立遠端 PR、push 展示弱點或變更 GitHub 設定。
> Workflow 檔案存在、可解析，不代表 GitHub 已啟用功能或雲端執行成功。

## 流程與驗收證據

| 觸點 | 觸發方式 | 必须記錄的證據 | 狀態 |
|---|---|---|---|
| CI | 符合 workflow 分支條件的 push／PR 或手動 dispatch | 對應 commit 的 run URL、每個 job 結果 | 待雲端驗證 |
| CodeQL | advanced workflow 分析 JS/TS、Python、Actions | analysis run、rule ID、位置、branch、alert URL | 待雲端驗證 |
| 程式品質 | ESLint／測試／實際 coverage | 真實輸出及報告；不把 lint 當成所有安全檢查 | 本地實作／驗證中 |
| Dependency Review | PR 相對 base 的相依差異 | 新增 GHSA、SPDX 授權與檢查結論 | 待雲端驗證 |
| Dependabot | default branch manifest/lockfile 與設定 | alert URL、GHSA、受影響版本、修復 PR | 待雲端驗證 |
| Copilot Review | PR 請求 review 或設定 automatic review | 可用方案、實際 review 留言 | 待雲端驗證 |
| Copilot Autofix | 支援的 CodeQL alert | 建議 diff、修復分支、回歸測試、重新掃描 | 待雲端驗證 |
| Secret Scanning | GitHub 接收的內容及歷史 | token 類型、位置、可用的 validity 狀態 | 待雲端驗證 |
| Push Protection | 推送包含可辨識新合成測試值的 commit | GitHub 真實拒絕訊息、重複演練結果 | 待雲端驗證 |
| PR 合併門禁 | required checks／code scanning merge protection | PR merge 狀態與真正阻擋原因 | 待雲端驗證 |

## 後續取得授權後才可執行

1. 核對 owner 權限、可見性、Copilot 方案及功能可用性；不要把 Pro、Business 或 Enterprise 任一方案當成既定事實。
2. 核對 CodeQL 是 default setup 或 advanced setup，依官方遷移流程處理，避免兩者衝突。確認 Actions 掃描未被只含 apps 的 paths 限制排除。
3. 推送前完成合成憑證來源複核；不得提交真實金鑰、停用保護或自動 bypass。非 provider 的通用密碼與 provider token 支援能力不同。
4. 先跑基準掃描，再建立有**新增**問題的 PR。普通分析成功只代表分析執行完；以實際 code-scanning 結果設定合併門禁，不以虛構 job 名稱建立規則。
5. Dependency Review 必須使用有差異的 PR；CVE 是已知弱點，不代表套件本身惡意。先查當下 advisory 與真正 SPDX 授權。
6. Copilot Review 必須確認可請求及實際產生 review；自動 review 需額外設定。Autofix 產出可能不同，不能保證每一個 alert 都支援。
7. 若要求 main 所有修改都經 PR，小抄不再提供直接推 main 的演示。不要為方便演示而移除既有門禁。
8. 把 run／PR／alert URL、日期、branch/ref、commit、操作結果記錄到驗證紀錄。沒有結果即保持 pending，不能只用截圖替代真實實測。

## 限制與安全界線

- 被 Push Protection 擋住的 commit 沒有被接收，不能期待同一次 push 的 Actions 啟動。示範 pipeline 請使用另外一個不含秘密的 commit。
- 相同 repo 的 hardened 分支不是獨立的 Secret Scanning／Dependabot 零警報區；切換分支不會抹除歷史警報。
- 本次沒有部署 Azure、Key Vault 或 CI/CD 的公開 CD 目標。pipeline 可產出建置 artifact；不能把 artifact 稱為已部署服務。
- 本地測試規則匹配 synthetic fixture 不是 GitHub Push Protection 的替代驗證。未命中時報告失敗並調整場景，不使用真實 Key。
- 原先要求的 58 個項目、警報門檻與人員彩排仍需逐項驗證，代表性情境完成不等於整案完成。

## 官方參考（實作時需再次核對）

- [Code scanning PR results](https://docs.github.com/en/code-security/code-scanning/managing-code-scanning-alerts/triaging-code-scanning-alerts-in-pull-requests)
- [Rulesets 與 PR 管理](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/managing-and-standardizing-pull-requests)
- [Copilot automatic review](https://docs.github.com/en/copilot/how-tos/agents/copilot-code-review/configuring-automatic-code-review-by-copilot)
- [Supported secret patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns)
- [Custom patterns](https://docs.github.com/en/code-security/secret-scanning/using-advanced-secret-scanning-and-push-protection-features/custom-patterns/managing-custom-patterns)
