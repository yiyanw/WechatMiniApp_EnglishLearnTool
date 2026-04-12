// data/sentences.js
// 句子语料 — audioUrl 填云存储 fileID，上传后替换
// start/end 单位：秒

var SENTENCES = [
  {
    id: 1,
    en: "Hello. My name is Cathy.",
    zh: "你好，我叫 Cathy。",
    audioUrl: "cloud://cloudbase-3grupbw990c1f2da.636c-cloudbase-3grupbw990c1f2da-1421372818/new-york-cafe.mp3",
    start: 28,
    end: 32
  },
  {
    id: 2,
    en: "I come from New York.",
    zh: "我来自纽约。",
    audioUrl: "cloud://cloudbase-3grupbw990c1f2da.636c-cloudbase-3grupbw990c1f2da-1421372818/new-york-cafe.mp3",
    start: 5.0,
    end: 7.2
  },
  {
    id: 3,
    en: "Nice to meet you.",
    zh: "很高兴认识你。",
    audioUrl: "cloud://cloudbase-3grupbw990c1f2da.636c-cloudbase-3grupbw990c1f2da-1421372818/new-york-cafe.mp3",
    start: 7.5,
    end: 9.1
  }
];

module.exports = {
  SENTENCES: SENTENCES
};
