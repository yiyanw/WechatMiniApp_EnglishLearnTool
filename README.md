# 英语句子复习小程序

为英语初学者提供极简的每日听力复习工具。打开即用，每天复习几句，无需复杂操作。

## 功能

### 今日复习（Tab 1）

- 每天从已学句子池中自动抽取复习卡片
- 卡片点击切换显示：隐藏 → 英文 → 中文
- 播放按钮播放对应句子音频片段（自动在 end 时间停止）
- 倍速播放：1.0x / 0.8x / 0.6x 循环切换
- 复习反馈：没懂 / 看懂了 / 听懂了 三档评分
- 加权随机抽取：没懂的句子优先复习（权重 4:2:1）
- 当天内多次打开，抽到的句子保持一致

### 全部句子（Tab 2）

- 按章节分组展示所有句子
- 每句可标记"已学"，加入复习池
- 支持播放和倍速控制

### 音频

- 单个章节音频文件 + 每句 start/end 时间戳
- 音频托管在微信云存储，通过云函数获取临时 URL
- 全局单例 InnerAudioContext，页面间复用

### 数据存储

所有数据存储在微信本地缓存（`wx.getStorageSync`）：

| Key | 内容 |
|-----|------|
| `learned_ids` | 已学句子 ID 列表 |
| `review_cards_YYYY-MM-DD` | 当天复习句子 ID |
| `srs_proficiency` | 熟练度 `{id: level}`，1=没懂 / 2=看懂了 / 3=听懂了 |

## 技术栈

- 微信小程序原生（WXML / WXSS / JS）
- CommonJS 模块
- `wx.createInnerAudioContext()` 音频播放
- 微信云存储 + 云函数 `getAudioUrl`

## 项目结构

```
miniprogram/
  app.js / app.json / app.wxss
  data/sentences.js          # 句子语料（id, en, zh, start, end）
  utils/
    audio.js                 # 音频播放 mixin（多页面复用）
    date.js                  # 日期工具
    random.js                # 随机抽取 + 加权随机
    storage.js               # 本地缓存封装
  pages/
    review/                  # 今日复习页
    sentences/               # 全部句子页
cloudfunctions/
  getAudioUrl/               # 云函数：云存储 fileID → 临时 HTTP URL
tests/                       # Jest 单元测试
```

## 开发

```bash
npm install
npm test
```

使用微信开发者工具打开项目，AppID: `wx15172bc9cc02ed03`。

## 可能的修改方向

### 短期改进

- **当天反馈锁定**：评分后当天不可更改，避免误触覆盖
- **复习完成状态**：所有卡片评分后显示"今日完成"
- **反馈统计**：展示累计复习天数、各熟练度分布
- **循环播放**：支持单句循环播放模式

### 中期扩展

- **进阶 SRS 算法**：引入复习间隔（类 SM-2），根据历史表现调整复习周期
- **云端同步**：将 learned_ids 和 srs_proficiency 同步到云数据库，支持换机不丢数据
- **多音频源**：支持多本书 / 多套语料切换
- **学习提醒**：每日定时推送复习提醒

### 长期方向

- **跟读评分**：录音 + 语音识别，给出发音反馈
- **错题本**：自动收集多次"没懂"的句子，集中突破
- **学习报告**：按周/月统计学习进度和薄弱点
