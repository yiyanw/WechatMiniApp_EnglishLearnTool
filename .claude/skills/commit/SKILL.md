---
name: commit
description: Code review, simplify, then commit. Use when committing changes.
disable-model-invocation: true
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git status *) Bash(git diff *) Bash(git log *) Bash(npm test *)
---

Please complete the following steps in order:

1. Run `/simplify` to review all changed code for reuse, quality, and efficiency, then fix any issues found.
2. Run `/code-review` to check code format, best practices, and performance issues, then fix any problems found.
3. Run `npm test` to ensure all tests pass. If any tests fail, fix the issues before proceeding.
4. Update CLAUDE.md if any new patterns, conventions, or key behaviors were added or changed.
5. After all fixes are applied and tests pass, create a git commit with a clear commit message summarizing all changes (including both the original work and any fixes).
