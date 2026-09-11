# BingoBlitz review and implementation guidance

This repository is an isolated security education application. Read docs/DEMO-CHEATSHEET.md and inspect the actual branch diff; do not assume a scenario is implemented because it appears in the plan.

- Preserve gameplay and server-authoritative Bingo verification. Never trust a client's claimed score or identity.
- Validate all HTTP and Socket.IO input at runtime. Authenticate callers and check room membership; only the host may start, draw or kick.
- Use parameterized SQL, transactions and idempotent scoring. Do not convert database failures into successful responses or silently discard persistence errors.
- Use cryptographically secure, unbiased randomness for cards, room codes and draws.
- Render chat as text; never interpolate user HTML. Restrict uploads and storage paths, and avoid arbitrary URLs or shell commands.
- Read required secrets from validated runtime configuration, with no hardcoded fallback. Never include real credentials or personal data in a diff, log or test fixture.
- Use least-privilege workflows with SHA-pinned actions. Do not run untrusted PR code with write tokens or deployment credentials.
- Add regression tests for fixes and report actual coverage rather than assuming it from test count. Include negative authorization tests and repeated-event tests.
- Report intentional demo vulnerabilities with concrete source/sink, impact, and a safe patch. Do not suppress findings just because they were introduced for demonstration.
- Keep fixes isolated from unrelated scenarios. Do not change repository policies, branches, or deployment settings as a shortcut to passing checks.
- Copilot advice is not a guarantee; changes require human review and testing. Do not claim an alert, cloud run, or Autofix succeeded without evidence.
