---
name: commit
description: Code review, simplify, then commit. Use when committing changes.
disable-model-invocation: true
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git status *) Bash(git diff *) Bash(git log *) Bash(npm test *)
---

Please complete the following steps in order:

1. Run `/code-review` to check code for reuse, format, best practices, and performance issues, then fix any problems found.
2. Run `/naming-review` to check for ambiguous, unclear, or inconsistent variable and method names, then fix any problems found.
3. Run `npm test` to ensure all tests pass. If any tests fail, fix the issues before proceeding.
4. Check if CLAUDE.md needs updating: new utility functions, key patterns, conventions, or skills added? If so, update the relevant section. If nothing new, skip.
5. After all fixes are applied and tests pass, create a git commit with a clear commit message summarizing all changes (including both the original work and any fixes).
