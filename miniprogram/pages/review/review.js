var sentenceData = require('../../data/sentences');
var storageUtil = require('../../utils/storage');
var srs = require('../../utils/srs/index');
var audioUtil = require('../../utils/audio');

Page({
  data: {
    cards: [],
    playingId: null,
    displayMode: {},
    playbackRate: 1.0,
    feedback: {}
  },

  _player: null,
  _srsStrategy: null,
  _shownToday: null,

  onLoad: function () {
    this._player = audioUtil.createAudioMixin(this, sentenceData.AUDIO_URL);
    this._player.initAudio();
    storageUtil.cleanOldCache();
  },

  onShow: function () {
    this._loadTodayCards();
  },

  onUnload: function () {
    this._player.destroyAudio();
  },

  onHide: function () {
    this._player.stopPlayback();
  },

  _loadTodayCards: function () {
    var allSentences = sentenceData.SENTENCES;
    var learnedSet = storageUtil.getLearnedSet();
    var pool = allSentences.filter(function (sentence) { return learnedSet[sentence.id]; });

    if (pool.length === 0) {
      this.setData({ cards: [] });
      return;
    }

    if (!this._shownToday) {
      this._shownToday = {};
    }
    var self = this;
    var freshPool = pool.filter(function (sentence) { return !self._shownToday[sentence.id]; });
    if (freshPool.length === 0) {
      wx.showToast({ title: '已学句子全部复习过了', icon: 'none' });
      return;
    }

    var cachedIds = storageUtil.getTodayReview();
    var cards;
    if (cachedIds) {
      cards = this._getSentencesByIds(cachedIds, freshPool);
    }
    if (!cards || cards.length === 0) {
      var strategy = srs.getActiveStrategy();
      this._srsStrategy = strategy;
      cards = strategy.selectCards(freshPool);
      var pickedIds = cards.map(function (sentence) { return sentence.id; });
      storageUtil.saveTodayReview(pickedIds);
    }
    if (!this._srsStrategy) {
      this._srsStrategy = srs.getActiveStrategy();
    }

    this.setData({ cards: cards, feedbackOptions: this._srsStrategy.getFeedbackOptions() });
    this._player.preloadAudio();
  },

  _getSentencesByIds: function (ids, allSentences) {
    var map = {};
    allSentences.forEach(function (sentence) { map[sentence.id] = sentence; });
    var result = [];
    ids.forEach(function (id) {
      if (map[id]) result.push(map[id]);
    });
    return result;
  },

  onToggleText: function (e) {
    var id = e.currentTarget.dataset.id;
    var key = 'displayMode.' + id;
    var current = this.data.displayMode[id] || 0;
    this.setData({ [key]: (current + 1) % 3 });
  },

  onFeedback: function (e) {
    var id = e.currentTarget.dataset.id;
    var rating = Number(e.currentTarget.dataset.rating);
    this._srsStrategy.recordFeedback(id, rating);
    this.setData({ ['feedback.' + id]: this._srsStrategy.getFeedbackLabel(rating) });
  },

  onRefresh: function () {
    var currentCards = this.data.cards;
    if (!this._shownToday) {
      this._shownToday = {};
    }
    currentCards.forEach(function (card) {
      this._shownToday[card.id] = true;
    }, this);
    storageUtil.clearTodayReview();
    this.setData({ displayMode: {}, feedback: {} });
    this._loadTodayCards();
  },

  onSpeedTap: function () {
    this._player.cycleSpeed();
  },

  onPlay: function (e) {
    this._player.handlePlay(e.currentTarget.dataset.id, this.data.cards);
  },

  onStop: function () {
    this._player.stopPlayback();
  }
});
