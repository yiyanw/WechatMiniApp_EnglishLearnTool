var sentenceData = require('../../data/sentences');
var audioUtil = require('../../utils/audio');
var storage = require('../../utils/storage');

Page({
  data: {
    groups: [],
    playingId: null,
    learnedSet: {},
    displayMode: {},
    playbackRate: 1.0
  },

  _player: null,

  onLoad: function () {
    this._player = audioUtil.createAudioMixin(this, sentenceData.AUDIO_URL);
    this._player.initAudio();
    this._loadSentences();
  },

  onShow: function () {
    this._refreshLearnedSet();
  },

  onUnload: function () {
    this._player.destroyAudio();
  },

  onHide: function () {
    this._player.stopPlayback();
  },

  _loadSentences: function () {
    var all = sentenceData.SENTENCES;
    var groupMap = {};
    var groupOrder = [];

    all.forEach(function (sentence) {
      var chapter = sentence.id.split('_')[0];
      if (!groupMap[chapter]) {
        groupMap[chapter] = { chapter: chapter, items: [] };
        groupOrder.push(chapter);
      }
      groupMap[chapter].items.push(sentence);
    });

    var groups = groupOrder.map(function (ch) { return groupMap[ch]; });
    this.setData({ groups: groups });
    this._player.preloadAudio();
  },

  _refreshLearnedSet: function () {
    this.setData({ learnedSet: storage.getLearnedSet() });
  },

  onToggleText: function (e) {
    var id = e.currentTarget.dataset.id;
    var key = 'displayMode.' + id;
    var current = this.data.displayMode[id];
    if (current === undefined) current = 1;
    this.setData({ [key]: (current + 1) % 3 });
  },

  onToggleLearned: function (e) {
    storage.toggleLearned(e.currentTarget.dataset.id);
    this.setData({ learnedSet: storage.getLearnedSet() });
  },

  onSpeedTap: function () {
    this._player.cycleSpeed();
  },

  onPlay: function (e) {
    this._player.handlePlay(e.currentTarget.dataset.id, sentenceData.SENTENCES);
  },

  onStop: function () {
    this._player.stopPlayback();
  }
});
