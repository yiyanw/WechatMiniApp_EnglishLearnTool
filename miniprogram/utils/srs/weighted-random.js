var srsStorage = require('./srs-storage');

var ALGO_KEY = 'weighted-random';
var WEIGHT_MAP = { 1: 4, 2: 2, 3: 1 };
var DEFAULT_PROFICIENCY = 2;
var DAILY_COUNT = 3;
var MAX_COUNT = 5;

function migrate() {
  var existing = srsStorage.getSrsData(ALGO_KEY);
  if (Object.keys(existing).length > 0) return;
  try {
    var old = wx.getStorageSync('srs_proficiency');
    if (old && typeof old === 'object' && Object.keys(old).length > 0) {
      srsStorage.setSrsData(ALGO_KEY, old);
    }
  } catch (e) {
    // ignore migration errors
  }
}

function getProficiency() {
  return srsStorage.getSrsData(ALGO_KEY);
}

function setProficiency(id, level) {
  var map = getProficiency();
  map[id] = level;
  srsStorage.setSrsData(ALGO_KEY, map);
}

function selectCards(pool) {
  if (!pool || pool.length === 0) return [];

  var proficiencyMap = getProficiency();
  var strugglingCount = 0;
  var candidates = pool.map(function (sentence) {
    var level = proficiencyMap[sentence.id] || DEFAULT_PROFICIENCY;
    if (level === 1) strugglingCount++;
    return { sentence: sentence, weight: WEIGHT_MAP[level] || WEIGHT_MAP[DEFAULT_PROFICIENCY] };
  });

  var targetCount = Math.min(DAILY_COUNT + Math.floor(strugglingCount / 2), MAX_COUNT, pool.length);
  var result = [];

  for (var picked = 0; picked < targetCount; picked++) {
    var totalWeight = 0;
    for (var i = 0; i < candidates.length; i++) {
      totalWeight += candidates[i].weight;
    }
    var randomThreshold = Math.random() * totalWeight;
    var cumulativeWeight = 0;
    for (var j = 0; j < candidates.length; j++) {
      cumulativeWeight += candidates[j].weight;
      if (randomThreshold < cumulativeWeight) {
        result.push(candidates[j].sentence);
        candidates.splice(j, 1);
        break;
      }
    }
  }

  return result;
}

var FEEDBACK_OPTIONS = [
  { rating: 1, label: '没懂', className: 'fb-btn--fail' },
  { rating: 2, label: '看懂了', className: 'fb-btn--read' },
  { rating: 3, label: '听懂了', className: 'fb-btn--listen' }
];

var FEEDBACK_LABELS = {
  1: '没懂 — 下次优先复习',
  2: '看懂了',
  3: '听懂了'
};

function create() {
  migrate();
  return {
    key: ALGO_KEY,
    selectCards: selectCards,
    recordFeedback: function (id, rating) {
      setProficiency(id, rating);
    },
    getFeedbackOptions: function () {
      return FEEDBACK_OPTIONS;
    },
    getFeedbackLabel: function (rating) {
      return FEEDBACK_LABELS[rating] || '';
    }
  };
}

module.exports = { create: create };
