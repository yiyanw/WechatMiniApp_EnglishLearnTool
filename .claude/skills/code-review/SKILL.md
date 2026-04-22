---
name: code-review
description: Review changed code for format, best practices, and performance issues, then fix any problems found.
---

Review all changed files for code format, best practices, and performance. Fix any issues found.

## Phase 1: Identify Changes

Run `git diff` (or `git diff HEAD` if there are staged changes) to see what changed. If there are no git changes, review the most recently modified files that the user mentioned or that you edited earlier in this conversation.

## Phase 2: Launch Three Review Agents in Parallel

Use the Agent tool to launch all three agents concurrently in a single message. Pass each agent the full diff and relevant file paths so it has the complete context.

### Agent 1: Code Format Review

Check all changed code against the project's conventions (see CLAUDE.md):

1. **Indentation**: 2-space indentation, no tabs
2. **Module style**: CommonJS (`module.exports` / `require()`), no ES module syntax
3. **File structure**: each page has 4 files (.js / .wxml / .wxss / .json)
4. **Naming**: private state uses `_` prefix (`_audio`, `_currentSentence`, `_mixer`), not placed in `data`
5. **Consistency**: similar patterns across pages should use the same structure and naming
6. **Whitespace**: no trailing whitespace, consistent blank lines between sections
7. **WXML**: proper attribute alignment, consistent use of `wx:if` / `wx:elif` / `wx:else`
8. **WXSS**: logical grouping of properties, consistent use of `rpx` units

### Agent 2: Best Practices Review

Check all changed code for WeChat mini program and general JavaScript best practices:

1. **Data flow**: page state in `data`, private state with `_` prefix outside `data`, no leaking between the two
2. **Event handlers**: proper use of `bindtap` / `bindchange`, correct dataset access via `e.currentTarget.dataset`
3. **Lifecycle**: proper init in `onLoad`, cleanup in `onUnload`, pause in `onHide`
4. **Audio**: correct `InnerAudioContext` usage — `obeyMuteSwitch`, event listener registration, `destroy()` on cleanup
5. **Storage**: `getStorageSync` / `setStorageSync` used correctly, no unnecessary reads
6. **Error handling**: user-facing errors shown via `wx.showToast`, console errors logged for debugging
7. **Avoid anti-patterns**: no `var self = this` when closures already capture the right context, no unnecessary nested callbacks, no synchronous blocking in async flows
8. **Security**: no raw user input in selectors or templates, no sensitive data in storage without consideration

### Agent 3: Performance Review

Check all changed code for performance issues:

1. **Unnecessary setData calls**: `setData` triggers re-render — avoid calling it in loops, with unchanged values, or with large data objects when only a path update is needed
2. **Redundant computation**: repeated lookups, unnecessary array iterations, work that could be cached
3. **Event handler efficiency**: handlers on hot paths (scroll, timeUpdate) should be lightweight
4. **Memory**: unbounded data structures, missing cleanup of audio/timer/listener resources in `onUnload`
5. **Audio**: unnecessary `src` reassignment (triggers reload), redundant `seek` + `play` sequences
6. **Network**: unnecessary cloud function calls, missing caching of resolved URLs
7. **Rendering**: large `wx:for` lists without `wx:key`, unnecessary re-renders from unrelated state changes
8. **Storage**: excessive `getStorageSync` calls that could be cached in memory

## Phase 3: Fix Issues

Wait for all three agents to complete. Aggregate their findings and fix each issue directly. If a finding is a false positive or not worth addressing, note it and move on.

When done, briefly summarize what was fixed (or confirm the code was already clean).
