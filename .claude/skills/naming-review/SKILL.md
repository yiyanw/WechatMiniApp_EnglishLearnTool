---
name: naming-review
description: Check changed code for ambiguous, unclear, or inconsistent variable and method names, then fix any problems found.
---

Review all changed files for naming clarity and consistency. Fix any issues found.

## Phase 1: Identify Changes

Run `git diff` (or `git diff HEAD` if there are staged changes) to see what changed. If there are no git changes, run `git diff HEAD~1` to review the last commit.

## Phase 2: Launch Review Agent

Use the Agent tool to launch one agent. Pass it the full diff and relevant file paths.

The agent should check all changed code for:

1. **Single-letter variables**: `s`, `d`, `r`, etc. in callbacks or loops — use descriptive names like `sentence`, `item`, `group`
2. **Generic parameter names**: `items`, `data`, `list`, `obj` — use domain-specific names like `sentences`, `learnedIds`, `groups`
3. **Misleading names**: names that suggest a different purpose than what the code does (e.g., `mixer` for a playback controller)
4. **Inconsistent naming across files**: same concept named differently in different files (e.g., `_mixer` in one page vs `_audioPlayer` in another)
5. **Abbreviations without context**: `ch`, `idx`, `res` in non-trivial scopes — expand if scope is longer than a few lines
6. **Private state naming**: verify `_` prefix convention per CLAUDE.md
7. **Boolean naming**: booleans should read as yes/no questions (`isPlaying`, `hasLearned`) not nouns

Report only genuine issues that would confuse a new developer. Skip standard conventions (`e` for event, `i` for loop index, `err` for error).

## Phase 3: Fix Issues

Fix each issue directly. Update CLAUDE.md if any renamed identifiers are referenced there. Run `npm test` after fixes to ensure nothing broke.

When done, briefly summarize what was fixed (or confirm the code was already clean).
