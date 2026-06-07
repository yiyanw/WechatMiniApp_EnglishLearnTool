var storage;

beforeEach(function () {
  __wxResetStorage();
  jest.resetModules();
  storage = require('../../miniprogram/utils/storage');
});

describe('learned ids', function () {
  it('returns empty array when nothing stored', function () {
    expect(storage.getLearnedIds()).toEqual([]);
  });

  it('toggleLearned adds an id', function () {
    storage.toggleLearned('1_1');
    expect(storage.getLearnedIds()).toEqual(['1_1']);
  });

  it('toggleLearned removes an existing id', function () {
    storage.toggleLearned('1_1');
    storage.toggleLearned('1_1');
    expect(storage.getLearnedIds()).toEqual([]);
  });

  it('toggleLearned handles multiple ids', function () {
    storage.toggleLearned('1_1');
    storage.toggleLearned('2_1');
    storage.toggleLearned('3_1');
    expect(storage.getLearnedIds()).toEqual(['1_1', '2_1', '3_1']);
  });

  it('getLearnedSet returns lookup object', function () {
    storage.toggleLearned('1_1');
    storage.toggleLearned('2_3');
    var set = storage.getLearnedSet();
    expect(set).toEqual({ '1_1': true, '2_3': true });
  });

  it('getLearnedSet returns empty object when none learned', function () {
    expect(storage.getLearnedSet()).toEqual({});
  });
});

describe('today review cache', function () {
  it('returns null when no cache exists', function () {
    expect(storage.getTodayReview()).toBeNull();
  });

  it('saves and retrieves today review', function () {
    var ids = ['1_1', '2_3', '5_1'];
    storage.saveTodayReview(ids);
    expect(storage.getTodayReview()).toEqual(ids);
  });

  it('returns null for empty sentenceIds', function () {
    var dateUtil = require('../../miniprogram/utils/date');
    var key = 'review_cards_' + dateUtil.getTodayKey();
    wx.setStorageSync(key, { sentenceIds: [] });
    expect(storage.getTodayReview()).toBeNull();
  });
});

describe('cleanOldCache', function () {
  it('removes old review caches but keeps today', function () {
    var dateUtil = require('../../miniprogram/utils/date');
    var todayKey = 'review_cards_' + dateUtil.getTodayKey();
    wx.setStorageSync(todayKey, { sentenceIds: ['1_1'] });
    wx.setStorageSync('review_cards_2020-01-01', { sentenceIds: ['2_1'] });
    wx.setStorageSync('review_cards_2020-06-15', { sentenceIds: ['3_1'] });
    wx.setStorageSync('learned_ids', ['1_1']);

    storage.cleanOldCache();

    expect(wx.removeStorageSync).toHaveBeenCalledWith('review_cards_2020-01-01');
    expect(wx.removeStorageSync).toHaveBeenCalledWith('review_cards_2020-06-15');
    expect(wx.removeStorageSync).not.toHaveBeenCalledWith(todayKey);
    expect(wx.removeStorageSync).not.toHaveBeenCalledWith('learned_ids');
  });
});

describe('clearTodayReview', function () {
  it('removes today review cache', function () {
    var dateUtil = require('../../miniprogram/utils/date');
    var todayKey = 'review_cards_' + dateUtil.getTodayKey();
    var ids = ['1_1', '2_3'];
    storage.saveTodayReview(ids);
    expect(storage.getTodayReview()).toEqual(ids);

    storage.clearTodayReview();
    expect(storage.getTodayReview()).toBeNull();
  });

  it('does not affect learned ids', function () {
    storage.toggleLearned('1_1');
    storage.clearTodayReview();
    expect(storage.getLearnedIds()).toEqual(['1_1']);
  });
});
