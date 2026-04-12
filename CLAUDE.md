# CLAUDE.md

## Project Overview

英语句子复习小程序 (English Sentence Review Mini Program)。
目标用户：英语初学者，每天打开复习 3 句英语，点击播放音频片段。
AppID: `wxa6fa27e3f6337440`, Project name: `english-review`

## Project Structure

```
miniprogram/
  app.js              # 应用入口，wx.cloud.init（仅用于云存储）
  app.json            # 单页路由：pages/review/review
  app.wxss            # 全局样式
  data/
    sentences.js      # 句子语料数组（id, en, zh, audioUrl, start, end）
  utils/
    date.js           # getTodayKey() → "YYYY-MM-DD"
    random.js         # pickRandom(arr, count) → Fisher-Yates 随机抽取
    storage.js        # 本地缓存：getTodayReview / saveTodayReview / cleanOldCache
  pages/
    review/           # 唯一页面 — 今日复习
      review.js       # 页面逻辑：加载卡片、音频播放控制
      review.wxml     # 页面模板：卡片列表 + 播放按钮
      review.wxss     # 页面样式
      review.json     # 页面配置
assets/
  audio/              # 音频源文件（不打包进小程序，上传到云存储后使用）
```

## Tech Stack

- Language: JavaScript (ES6+, CommonJS modules)
- View: WXML / WXSS
- Audio: `wx.createInnerAudioContext()`
- Storage: `wx.getStorageSync` / `wx.setStorageSync`
- Cloud: 仅使用云存储托管音频文件（`wx.cloud.getTempFileURL`）

## Code Conventions

- 2-space indentation
- CommonJS: `module.exports` / `require()`
- 每页 4 文件：.js / .wxml / .wxss / .json
- 单个 `InnerAudioContext` 实例，页面级复用
- 私有状态用 `_` 前缀（`_audio`, `_currentSentence`），不放入 `data`

## Key Patterns

- 每日抽取：`pickRandom(SENTENCES, 3)` → 缓存到 `review_cards_YYYY-MM-DD`
- 音频播放：`stop → set src → onCanplay → seek(start) → onSeeked → play()`
- 播放结束检测：`onTimeUpdate` 检查 `currentTime >= end`
- 云存储 URL：`cloud://` fileID → `getTempFileURL` 转临时 URL
