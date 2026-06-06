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
    srs/
      index.js        # SRS 策略注册中心（register / getActiveStrategy / switchAlgorithm）
      srs-storage.js  # 算法无关的存储层（按算法 key 隔离数据）
      weighted-random.js  # 加权随机策略（默认算法）
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
- 私有状态用 `_` 前缀（`_audio`, `_currentSentence`, `_player`），不放入 `data`

## Code Style Rules

- 函数只做一件事。如果需要用"和"来描述，就拆分它
- 变量名描述内容，函数名描述行为，不要缩写（`getUserProfile` 而非 `getUsrProf`）
- 不留注释掉的代码，Git 会记住
- 显式处理错误，不吞异常。用户可见的错误用 `wx.showToast`，调试信息用 `console.error`
- 错误消息要具体，包含错误码或原因，不要泛泛的"操作失败"
- 文件不超过 300 行，长了就拆模块
- 跨页面复用的逻辑抽到 `utils/`，跨页面共享的样式放 `app.wxss`

## Testing Rules

- 测试验证行为而非实现细节
- 每个测试一个明确断言，测试名说明它证明了什么
- 优先用真实依赖，只 mock 外部服务（`wx` API）
- 每个 bug fix 必须带回归测试
- 提交前跑 `npm test`，全部通过才能提交

## Workflow Rules

- 非简单任务（3 步以上或涉及架构决策）先进 plan mode
- 用 subagent 做探索和并行分析，保持主上下文干净
- 用户纠正后立即更新 CLAUDE.md 防止重犯
- 完成前必须证明能工作：跑测试、检查 diff
- 简单修复不过度工程化，三行相似代码优于过早抽象

## Skills

自定义 skill 放在 `.claude/skills/<skill-name>/SKILL.md`，通过 `/skill-name` 调用。
- `/gen-sentences <whisper.json> <output.js>` — 从 whisper 转录结果生成 sentences.js
- `/commit` — 代码审查 + 运行测试 + 提交
- `/code-review` — 检查代码格式、最佳实践、性能问题并修复
- `/naming-review` — 检查变量名、方法名是否存在歧义或不清晰并修复

## Key Patterns

- 已学标记：`toggleLearned(id)` 写入 `learned_ids`，`getLearnedSet()` 返回 {id: true} 查找表
- 每日抽取：从已学池 `filter(learnedSet)` → `strategy.selectCards(pool)` → 缓存到 `review_cards_YYYY-MM-DD`
- SRS 策略模式：`utils/srs/index.js` 管理算法注册与切换，每种算法实现 `selectCards / recordFeedback / getFeedbackOptions / getFeedbackLabel` 四个方法
- SRS 时间衰减：`weighted-random` 的 `selectCards` 权重乘上 `1 + daysSince × decayRate`，`recordFeedback` 同时保存时间戳到 `srs_data_<key>_timestamps`
- SRS 存储隔离：每种算法数据存在 `srs_data_<algorithm_key>`，切换算法不丢数据，旧 `srs_proficiency` 自动迁移
- 添加新算法：新建 `utils/srs/<name>.js` 实现接口 + 在 `index.js` 中 `register()`，无需改页面
- 复习反馈：按钮配置由算法的 `getFeedbackOptions()` 驱动，WXML 动态渲染
- 音频 Mixin：`createAudioMixin(page)` 封装播放/停止/URL 解析，页面通过 `_player` 引用
- 音频播放：`set _currentSentence → resolveUrl → _doPlay(onCanplay → play)`，不再用 `seek` 避免真机 error -1
- 倍速播放：`SPEEDS = [1.0, 0.8, 0.6]`，`cycleSpeed()` 循环切换，`setPlaybackRate()` 同步 `_playbackRate` + `page.data.playbackRate`
- 播放结束检测：`onTimeUpdate` 检查 `currentTime >= end`
- 云存储 URL：`cloud://` fileID → 云函数 `getAudioUrl` → 缓存到内存 `_tempUrlMap`
- 音频错误处理：预加载阶段的 error 不弹 toast（只记 console.error），播放阶段的 error 才弹 toast（3 秒冷却防重复）；系统回调（onEnded/onTimeUpdate/onError）用 `_clearState()` 仅清理 UI 状态，`stopPlayback(true)` 主动停止才调 `audio.stop()`
- 句子分组：sentences 页按 `id.split('_')[0]`（章节号）分组展示
