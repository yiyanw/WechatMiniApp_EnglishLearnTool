var weightedRandom;

var pool = [
  { id: 'a', en: 'A', zh: 'A中' },
  { id: 'b', en: 'B', zh: 'B中' },
  { id: 'c', en: 'C', zh: 'C中' },
  { id: 'd', en: 'D', zh: 'D中' },
  { id: 'e', en: 'E', zh: 'E中' }
];

beforeEach(function () {
  __wxResetStorage();
  jest.resetModules();
  weightedRandom = require('../../../miniprogram/utils/srs/weighted-random');
});

describe('create', function () {
  it('returns object with all interface methods', function () {
    var strategy = weightedRandom.create();
    expect(strategy.key).toBe('weighted-random');
    expect(typeof strategy.selectCards).toBe('function');
    expect(typeof strategy.recordFeedback).toBe('function');
    expect(typeof strategy.getFeedbackOptions).toBe('function');
    expect(typeof strategy.getFeedbackLabel).toBe('function');
  });
});

describe('selectCards', function () {
  it('returns empty array for empty pool', function () {
    var strategy = weightedRandom.create();
    expect(strategy.selectCards([])).toEqual([]);
    expect(strategy.selectCards(null)).toEqual([]);
  });

  it('returns 3 items from a normal pool', function () {
    var strategy = weightedRandom.create();
    var result = strategy.selectCards(pool);
    expect(result).toHaveLength(3);
  });

  it('returns all items when pool smaller than count', function () {
    var small = [{ id: 'x' }, { id: 'y' }];
    var strategy = weightedRandom.create();
    var result = strategy.selectCards(small);
    expect(result).toHaveLength(2);
  });

  it('returns unique items', function () {
    var strategy = weightedRandom.create();
    for (var i = 0; i < 20; i++) {
      var result = strategy.selectCards(pool);
      var ids = result.map(function (s) { return s.id; });
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('increases count when struggling sentences exist', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    srsStorage.setSrsData('weighted-random', { a: 1, b: 1, c: 1, d: 1 });
    jest.resetModules();
    weightedRandom = require('../../../miniprogram/utils/srs/weighted-random');
    var strategy = weightedRandom.create();
    var result = strategy.selectCards(pool);
    expect(result.length).toBeGreaterThanOrEqual(4);
  });

  it('caps count at 5', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    var bigPool = [];
    var prof = {};
    for (var i = 0; i < 20; i++) {
      bigPool.push({ id: 's' + i });
      prof['s' + i] = 1;
    }
    srsStorage.setSrsData('weighted-random', prof);
    jest.resetModules();
    weightedRandom = require('../../../miniprogram/utils/srs/weighted-random');
    var strategy = weightedRandom.create();
    var result = strategy.selectCards(bigPool);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('favors struggling sentences over solid ones', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    srsStorage.setSrsData('weighted-random', { a: 1, b: 3, c: 3, d: 3, e: 3 });
    jest.resetModules();
    weightedRandom = require('../../../miniprogram/utils/srs/weighted-random');
    var strategy = weightedRandom.create();
    var counts = {};
    pool.forEach(function (s) { counts[s.id] = 0; });
    for (var i = 0; i < 200; i++) {
      var result = strategy.selectCards(pool);
      counts[result[0].id]++;
    }
    expect(counts.a).toBeGreaterThan(counts.b);
  });
});

describe('recordFeedback', function () {
  it('persists proficiency to namespaced storage', function () {
    var strategy = weightedRandom.create();
    strategy.recordFeedback('1_1', 3);
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    expect(srsStorage.getSrsData('weighted-random')).toEqual({ '1_1': 3 });
  });

  it('overwrites previous level', function () {
    var strategy = weightedRandom.create();
    strategy.recordFeedback('1_1', 1);
    strategy.recordFeedback('1_1', 3);
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    expect(srsStorage.getSrsData('weighted-random')['1_1']).toBe(3);
  });
});

describe('getFeedbackOptions', function () {
  it('returns 3 options with correct structure', function () {
    var strategy = weightedRandom.create();
    var options = strategy.getFeedbackOptions();
    expect(options).toHaveLength(3);
    options.forEach(function (opt) {
      expect(opt).toHaveProperty('rating');
      expect(opt).toHaveProperty('label');
      expect(opt).toHaveProperty('className');
    });
  });

  it('has ratings 1, 2, 3', function () {
    var strategy = weightedRandom.create();
    var ratings = strategy.getFeedbackOptions().map(function (o) { return o.rating; });
    expect(ratings).toEqual([1, 2, 3]);
  });
});

describe('getFeedbackLabel', function () {
  it('maps each rating to a label', function () {
    var strategy = weightedRandom.create();
    expect(strategy.getFeedbackLabel(1)).toContain('没懂');
    expect(strategy.getFeedbackLabel(2)).toBe('看懂了');
    expect(strategy.getFeedbackLabel(3)).toBe('听懂了');
  });

  it('returns empty string for unknown rating', function () {
    var strategy = weightedRandom.create();
    expect(strategy.getFeedbackLabel(99)).toBe('');
  });
});

describe('migration', function () {
  it('migrates old srs_proficiency data on first create', function () {
    wx.setStorageSync('srs_proficiency', { '1_1': 1, '2_1': 3 });
    jest.resetModules();
    weightedRandom = require('../../../miniprogram/utils/srs/weighted-random');
    weightedRandom.create();
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    expect(srsStorage.getSrsData('weighted-random')).toEqual({ '1_1': 1, '2_1': 3 });
  });

  it('does not overwrite existing data during migration', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    srsStorage.setSrsData('weighted-random', { '3_1': 2 });
    wx.setStorageSync('srs_proficiency', { '1_1': 1 });
    jest.resetModules();
    weightedRandom = require('../../../miniprogram/utils/srs/weighted-random');
    weightedRandom.create();
    srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    expect(srsStorage.getSrsData('weighted-random')).toEqual({ '3_1': 2 });
  });
});

describe('refresh flow — scores persist across card batches', function () {
  it('keeps feedback scores after clearing today cache', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    var storage = require('../../../miniprogram/utils/storage');
    var strategy = weightedRandom.create();

    // First batch: select 3 cards and give feedback
    var firstBatch = strategy.selectCards(pool);
    expect(firstBatch.length).toBe(3);
    strategy.recordFeedback(firstBatch[0].id, 1);
    strategy.recordFeedback(firstBatch[1].id, 3);
    strategy.recordFeedback(firstBatch[2].id, 2);

    // Simulate onRefresh: clear today cache
    storage.clearTodayReview();

    // Scores must still be there — clearTodayReview only removes
    // the review_cards_ key, not the srs_data_ keys
    var scores = srsStorage.getSrsData('weighted-random');
    expect(scores[firstBatch[0].id]).toBe(1);
    expect(scores[firstBatch[1].id]).toBe(3);
    expect(scores[firstBatch[2].id]).toBe(2);
  });

  it('accumulates scores across multiple refresh rounds', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    var storage = require('../../../miniprogram/utils/storage');
    var strategy = weightedRandom.create();

    // Round 1: give feedback on 3 cards
    strategy.recordFeedback('a', 1);
    strategy.recordFeedback('b', 3);
    strategy.recordFeedback('c', 2);
    storage.clearTodayReview();

    // Round 2: give feedback on 3 different cards
    strategy.recordFeedback('d', 1);
    strategy.recordFeedback('e', 3);

    // All 5 cards' scores should be preserved
    var scores = srsStorage.getSrsData('weighted-random');
    expect(scores.a).toBe(1);
    expect(scores.b).toBe(3);
    expect(scores.c).toBe(2);
    expect(scores.d).toBe(1);
    expect(scores.e).toBe(3);
    expect(Object.keys(scores).length).toBe(5);
  });

  it('updating a card in a later round overwrites its previous score', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    var storage = require('../../../miniprogram/utils/storage');
    var strategy = weightedRandom.create();

    // Round 1: mark card 'a' as 没懂
    strategy.recordFeedback('a', 1);
    storage.clearTodayReview();

    // Round 2: now user understands it, mark as 听懂了
    strategy.recordFeedback('a', 3);

    var scores = srsStorage.getSrsData('weighted-random');
    expect(scores.a).toBe(3);
  });

  it('excludes already-shown cards on refresh', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    var storage = require('../../../miniprogram/utils/storage');
    var strategy = weightedRandom.create();

    var bigPool = [
      { id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' },
      { id: 's6' }, { id: 's7' }
    ];

    // First batch
    var firstBatch = strategy.selectCards(bigPool);
    expect(firstBatch.length).toBe(3);

    // Mark first batch as shown
    var shown = {};
    firstBatch.forEach(function (s) { shown[s.id] = true; });

    // Fresh pool excluding shown cards
    var freshPool = bigPool.filter(function (s) { return !shown[s.id]; });
    expect(freshPool.length).toBe(4);

    // Second batch from filtered pool
    storage.clearTodayReview();
    var secondBatch = strategy.selectCards(freshPool);
    expect(secondBatch.length).toBe(3);

    // No overlap between first and second batch
    var secondIds = {};
    secondBatch.forEach(function (s) { secondIds[s.id] = true; });
    firstBatch.forEach(function (s) {
      expect(secondIds[s.id]).toBeUndefined();
    });
  });

  it('returns all remaining cards when fresh pool is smaller than daily count', function () {
    var strategy = weightedRandom.create();

    var remaining = [{ id: 'x' }, { id: 'y' }];
    var result = strategy.selectCards(remaining);
    expect(result.length).toBe(2);
    var ids = result.map(function (s) { return s.id; });
    expect(ids).toContain('x');
    expect(ids).toContain('y');
  });

  it('restores last refreshed batch from cache on app restart', function () {
    var storage = require('../../../miniprogram/utils/storage');
    var strategy = weightedRandom.create();

    // Simulate review page _loadTodayCards flow
    var bigPool = [
      { id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' },
      { id: 's6' }, { id: 's7' }
    ];
    var shown = {};

    // Round 1: first load, pick 3 and save to cache
    var firstBatch = strategy.selectCards(bigPool);
    var firstIds = firstBatch.map(function (s) { return s.id; });
    storage.saveTodayReview(firstIds);

    // Simulate app restart: getTodayReview returns cached IDs
    var cachedIds = storage.getTodayReview();
    expect(cachedIds).toEqual(firstIds);

    // Resolve cached IDs back to sentences
    var idToSentence = {};
    bigPool.forEach(function (s) { idToSentence[s.id] = s; });
    var restored = cachedIds.map(function (id) { return idToSentence[id]; });
    expect(restored.length).toBe(3);
    expect(restored).toEqual(firstBatch);

    // Round 2: user clicks refresh — mark first batch as shown, clear cache, re-select
    firstBatch.forEach(function (s) { shown[s.id] = true; });
    storage.clearTodayReview();
    var freshPool = bigPool.filter(function (s) { return !shown[s.id]; });
    var secondBatch = strategy.selectCards(freshPool);
    var secondIds = secondBatch.map(function (s) { return s.id; });
    storage.saveTodayReview(secondIds);

    // Simulate app restart again: should restore second batch, not first
    var cachedAfterRefresh = storage.getTodayReview();
    expect(cachedAfterRefresh).toEqual(secondIds);

    // Verify second batch has no overlap with first
    firstIds.forEach(function (id) {
      expect(cachedAfterRefresh.indexOf(id)).toBe(-1);
    });
  });
});

describe('time decay', function () {
  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  it('recordFeedback also saves last review timestamp', function () {
    var strategy = weightedRandom.create();
    var before = Date.now();
    strategy.recordFeedback('1_1', 3);
    var after = Date.now();
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    var timestamp = srsStorage.getLastReviewTimes('weighted-random')['1_1'];
    expect(typeof timestamp).toBe('number');
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('old review cards have higher weight than recent ones with same level', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    srsStorage.setSrsData('weighted-random', { a: 3, b: 3, c: 3, d: 3, e: 3 });
    var now = Date.now();
    srsStorage.setLastReviewTime('weighted-random', 'a', now - 30 * MS_PER_DAY);
    srsStorage.setLastReviewTime('weighted-random', 'b', now);
    srsStorage.setLastReviewTime('weighted-random', 'c', now);
    srsStorage.setLastReviewTime('weighted-random', 'd', now);
    srsStorage.setLastReviewTime('weighted-random', 'e', now);
    var strategy = weightedRandom.create();
    var counts = { a: 0, b: 0 };
    for (var i = 0; i < 200; i++) {
      var result = strategy.selectCards(pool, now);
      if (result[0].id === 'a') counts.a++;
      if (result[0].id === 'b') counts.b++;
    }
    expect(counts.a).toBeGreaterThan(counts.b);
  });

  it('cards with no timestamp are treated as old and get high weight', function () {
    var srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
    srsStorage.setSrsData('weighted-random', { a: 3, b: 3, c: 3, d: 3, e: 3 });
    var now = Date.now();
    srsStorage.setLastReviewTime('weighted-random', 'b', now);
    srsStorage.setLastReviewTime('weighted-random', 'c', now);
    srsStorage.setLastReviewTime('weighted-random', 'd', now);
    srsStorage.setLastReviewTime('weighted-random', 'e', now);
    var strategy = weightedRandom.create();
    var counts = { a: 0, b: 0 };
    for (var i = 0; i < 200; i++) {
      var result = strategy.selectCards(pool, now);
      if (result[0].id === 'a') counts.a++;
      if (result[0].id === 'b') counts.b++;
    }
    expect(counts.a).toBeGreaterThan(counts.b);
  });
});
