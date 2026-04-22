var sentenceData = require('../../data/sentences');
var storageUtil = require('../../utils/storage');
var random = require('../../utils/random');
var audioUtil = require('../../utils/audio');

var DAILY_COUNT = 3;

Page({
  data: {
    cards: [],
    playingId: null,
    displayMode: {},
    playbackRate: 1.0
  },

  _player: null,

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

    var cachedIds = storageUtil.getTodayReview();
    var cards;
    if (cachedIds) {
      cards = this._getSentencesByIds(cachedIds, pool);
    }
    if (!cards || cards.length === 0) {
      cards = random.pickRandom(pool, DAILY_COUNT);
      var pickedIds = cards.map(function (sentence) { return sentence.id; });
      storageUtil.saveTodayReview(pickedIds);
    }

    this.setData({ cards: cards });
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
