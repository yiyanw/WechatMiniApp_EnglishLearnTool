var sentences = require('../../data/sentences');
var storageUtil = require('../../utils/storage');
var random = require('../../utils/random');
var audioUtil = require('../../utils/audio');

var DAILY_COUNT = 3;

Page({
  data: {
    cards: [],
    playingId: null
  },

  _mixer: null,

  onLoad: function () {
    this._mixer = audioUtil.createAudioMixin(this);
    this._mixer.initAudio();
    storageUtil.cleanOldCache();
  },

  onShow: function () {
    this._loadTodayCards();
  },

  onUnload: function () {
    this._mixer.destroyAudio();
  },

  onHide: function () {
    this._mixer.stopPlayback();
  },

  _loadTodayCards: function () {
    var allSentences = sentences.SENTENCES;
    var learnedSet = storageUtil.getLearnedSet();
    var pool = allSentences.filter(function (s) { return learnedSet[s.id]; });

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
      var pickedIds = cards.map(function (s) { return s.id; });
      storageUtil.saveTodayReview(pickedIds);
    }

    this.setData({ cards: cards });
    this._mixer.preloadAudioUrls(cards);
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

  onPlay: function (e) {
    this._mixer.handlePlay(e.currentTarget.dataset.id, this.data.cards);
  },

  onStop: function () {
    this._mixer.stopPlayback();
  }
});
