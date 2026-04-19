---
name: commit
description: Code review, simplify, then commit. Use when committing changes.
disable-model-invocation: true
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git status *) Bash(git diff *) Bash(git log *)
---

Please complete the following steps in order:

1. Run `/simplify` to review all changed code for reuse, quality, and efficiency, then fix any issues found.
2. After all simplify fixes are applied, create a git commit with a clear commit message summarizing all changes (including both the original work and any simplify fixes).
