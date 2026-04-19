var sentences = require('../../data/sentences');
var audioUtil = require('../../utils/audio');
var storage = require('../../utils/storage');

Page({
  data: {
    groups: [],
    playingId: null,
    learnedSet: {}
  },

  _mixer: null,

  onLoad: function () {
    this._mixer = audioUtil.createAudioMixin(this);
    this._mixer.initAudio();
    this._loadSentences();
  },

  onShow: function () {
    this._refreshLearnedSet();
  },

  onUnload: function () {
    this._mixer.destroyAudio();
  },

  onHide: function () {
    this._mixer.stopPlayback();
  },

  _loadSentences: function () {
    var all = sentences.SENTENCES;
    var groupMap = {};
    var groupOrder = [];

    all.forEach(function (s) {
      var chapter = s.id.split('_')[0];
      if (!groupMap[chapter]) {
        groupMap[chapter] = { chapter: chapter, items: [] };
        groupOrder.push(chapter);
      }
      groupMap[chapter].items.push(s);
    });

    var groups = groupOrder.map(function (ch) { return groupMap[ch]; });
    this.setData({ groups: groups });
    this._mixer.preloadAudioUrls(all);
  },

  _refreshLearnedSet: function () {
    var ids = storage.getLearnedIds();
    var set = {};
    ids.forEach(function (id) { set[id] = true; });
    this.setData({ learnedSet: set });
  },

  onToggleLearned: function (e) {
    var id = e.currentTarget.dataset.id;
    var ids = storage.toggleLearned(id);
    var set = {};
    ids.forEach(function (id) { set[id] = true; });
    this.setData({ learnedSet: set });
  },

  onPlay: function (e) {
    this._mixer.handlePlay(e.currentTarget.dataset.id, sentences.SENTENCES);
  },

  onStop: function () {
    this._mixer.stopPlayback();
  }
});
