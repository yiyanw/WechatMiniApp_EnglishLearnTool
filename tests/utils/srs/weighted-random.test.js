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
