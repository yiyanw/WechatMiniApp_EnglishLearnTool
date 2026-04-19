# CLAUDE.md

## Project Overview

英语句子复习小程序 (English Sentence Review Mini Program)。
目标用户：英语初学者。在"全部句子"页标记已学句子，每天从已学池中随机抽取 3 句复习，点击播放音频片段。
AppID: `wx15172bc9cc02ed03`, Project name: `english-review`

## Project Structure

```
miniprogram/
  app.js              # 应用入口，wx.cloud.init（仅用于云存储）
  app.json            # 双页路由 + tabBar（今日复习 / 全部句子）
  app.wxss            # 全局样式
  data/
    sentences.js      # AUDIO_URL 常量 + 句子语料数组（id, en, zh, start, end）
  utils/
    audio.js          # createAudioMixin(page, audioUrl) — 音频播放逻辑，页面间复用
    date.js           # getTodayKey() → "YYYY-MM-DD"
    random.js         # pickRandom(arr, count) → Fisher-Yates 随机抽取
    storage.js        # 本地缓存：每日复习 + 已学标记（learned_ids）
  pages/
    review/           # Tab 1 — 今日复习（从已学池随机抽 3 句）
      review.js
      review.wxml
      review.wxss
      review.json
    sentences/        # Tab 2 — 全部句子（按章节分组，可标记已学）
      sentences.js
      sentences.wxml
      sentences.wxss
      sentences.json
assets/
  audio/              # 音频源文件（不打包进小程序，上传到云存储后使用）
```

## Tech Stack

- Language: JavaScript (ES6+, CommonJS modules)
- View: WXML / WXSS
- Audio: `wx.createInnerAudioContext()`
- Storage: `wx.getStorageSync` / `wx.setStorageSync`
- Cloud: 云存储托管音频 + 云函数 `getAudioUrl` 获取临时 URL

## Code Conventions

- 2-space indentation
- CommonJS: `module.exports` / `require()`
- 每页 4 文件：.js / .wxml / .wxss / .json
- 音频逻辑通过 `createAudioMixin(page)` 混入，多页面复用同一套播放逻辑
- 私有状态用 `_` 前缀（`_audio`, `_currentSentence`, `_mixer`），不放入 `data`

## Key Patterns

- 已学标记：`toggleLearned(id)` 写入 `learned_ids`，`getLearnedSet()` 返回 {id: true} 查找表
- 每日抽取：从已学池 `filter(learnedSet)` → `pickRandom(pool, 3)` → 缓存到 `review_cards_YYYY-MM-DD`
- 音频 Mixin：`createAudioMixin(page)` 封装播放/停止/URL 解析，页面通过 `_mixer` 引用
- 音频播放：`pause → resolveUrl → set src + startTime → play()`；同 src 时直接 `seek + play`
- 播放结束检测：`onTimeUpdate` 检查 `currentTime >= end`
- 云存储 URL：`cloud://` fileID → 云函数 `getAudioUrl` → 缓存到内存 `_tempUrlMap`
- 句子分组：sentences 页按 `id.split('_')[0]`（章节号）分组展示
