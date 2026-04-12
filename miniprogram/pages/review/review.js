// pages/review/review.js
var sentences = require('../../data/sentences');
var storage = require('../../utils/storage');
var random = require('../../utils/random');

var DAILY_COUNT = 3;

Page({
  data: {
    cards: [],
    playingId: null
  },

  _audio: null,
  _currentSentence: null,
  _checkTimer: null,
  _tempUrlMap: {},

  // ===== 生命周期 =====

  onLoad: function () {
    this._initAudio();
    this._loadTodayCards();
    storage.cleanOldCache();
  },

  onUnload: function () {
    this._destroyAudio();
  },

  onHide: function () {
    this._stopPlayback();
  },

  // ===== 音频初始化 =====

  _initAudio: function () {
    var self = this;
    var audio = wx.createInnerAudioContext();
    audio.obeyMuteSwitch = false;

    audio.onError(function (err) {
      console.error('Audio error:', err);
      wx.showToast({ title: '播放失败', icon: 'none', duration: 2000 });
      self._stopPlayback();
    });

    audio.onEnded(function () {
      self._stopPlayback();
    });

    audio.onTimeUpdate(function () {
      if (!self._currentSentence) return;
      if (audio.currentTime >= self._currentSentence.end) {
        audio.pause();
        self._currentSentence = null;
        self.setData({ playingId: null });
      }
    });

    self._audio = audio;
  },

  _destroyAudio: function () {
    this._clearCheckTimer();
    if (this._audio) {
      this._audio.stop();
      this._audio.destroy();
      this._audio = null;
    }
    this._currentSentence = null;
    this.setData({ playingId: null });
  },

  // ===== 加载今日卡片 =====

  _loadTodayCards: function () {
    var allSentences = sentences.SENTENCES;
    var cachedIds = storage.getTodayReview();

    var cards;
    if (cachedIds) {
      cards = this._getSentencesByIds(cachedIds, allSentences);
    }
    if (!cards || cards.length === 0) {
      cards = random.pickRandom(allSentences, DAILY_COUNT);
      var pickedIds = cards.map(function (s) { return s.id; });
      storage.saveTodayReview(pickedIds);
    }

    this.setData({ cards: cards });
    this._preloadAudioUrls(cards);
  },

  // 页面加载时预先获取所有音频的临时 URL
  _preloadAudioUrls: function (cards) {
    var self = this;
    var cloudIds = [];
    cards.forEach(function (card) {
      if (card.audioUrl && card.audioUrl.indexOf('cloud://') === 0 && !self._tempUrlMap[card.audioUrl]) {
        if (cloudIds.indexOf(card.audioUrl) === -1) {
          cloudIds.push(card.audioUrl);
        }
      }
    });
    cloudIds.forEach(function (fileID) {
      self._resolveUrl(fileID, function () {});
    });
  },

  _getSentencesByIds: function (ids, allSentences) {
    var map = {};
    allSentences.forEach(function (s) { map[s.id] = s; });
    var result = [];
    ids.forEach(function (id) {
      if (map[id]) result.push(map[id]);
    });
    return result;
  },

  // ===== cloud:// URL 转换 =====

  _resolveUrl: function (cloudFileId, callback) {
    var self = this;
    if (self._tempUrlMap[cloudFileId]) {
      callback(self._tempUrlMap[cloudFileId]);
      return;
    }
    wx.cloud.callFunction({
      name: 'getAudioUrl',
      data: { fileID: cloudFileId },
      success: function (res) {
        if (res.result && res.result.url) {
          self._tempUrlMap[cloudFileId] = res.result.url;
          callback(res.result.url);
        } else {
          console.error('getAudioUrl failed:', res.result);
          wx.showToast({ title: '音频地址获取失败', icon: 'none' });
        }
      },
      fail: function (err) {
        console.error('callFunction getAudioUrl failed:', err);
        wx.showToast({ title: '音频地址获取失败', icon: 'none' });
      }
    });
  },

  // ===== 播放控制 =====

  onPlay: function (e) {
    var id = e.currentTarget.dataset.id;

    if (this.data.playingId === id) {
      this._stopPlayback();
      return;
    }

    var sentence = null;
    for (var i = 0; i < this.data.cards.length; i++) {
      if (this.data.cards[i].id === id) {
        sentence = this.data.cards[i];
        break;
      }
    }
    if (!sentence) return;

    if (sentence.start >= sentence.end) {
      console.error('Invalid timestamps for sentence', sentence.id);
      wx.showToast({ title: '数据异常', icon: 'none' });
      return;
    }

    this._playSentence(sentence);
  },

  onStop: function () {
    this._stopPlayback();
  },

  _playSentence: function (sentence) {
    var audio = this._audio;
    if (!audio) return;
    var self = this;

    // 停止当前播放
    audio.pause();
    this._currentSentence = sentence;
    this.setData({ playingId: sentence.id });

    // cloud:// 需要先转成 http 临时链接
    var audioUrl = sentence.audioUrl;
    if (audioUrl.indexOf('cloud://') === 0) {
      self._resolveUrl(audioUrl, function (httpUrl) {
        if (self._currentSentence && self._currentSentence.id === sentence.id) {
          self._doPlay(httpUrl, sentence.start);
        }
      });
    } else {
      self._doPlay(audioUrl, sentence.start);
    }
  },

  _doPlay: function (url, startTime) {
    var audio = this._audio;
    if (!audio) return;

    if (audio.src === url) {
      // 同一音频文件，直接 seek 到目标位置再播放
      audio.seek(startTime);
      audio.play();
    } else {
      // 新音频文件，设置 src + startTime
      audio.src = url;
      audio.startTime = startTime;
      audio.play();
    }
  },

  _stopPlayback: function () {
    this._clearCheckTimer();
    if (this._audio) {
      this._audio.pause();
    }
    this._currentSentence = null;
    this.setData({ playingId: null });
  },

  _clearCheckTimer: function () {
    if (this._checkTimer) {
      clearInterval(this._checkTimer);
      this._checkTimer = null;
    }
  }
});
