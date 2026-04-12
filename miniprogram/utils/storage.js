// utils/storage.js
var dateUtil = require('./date');

var STORAGE_PREFIX = 'review_cards_';

function getTodayReview() {
  var key = STORAGE_PREFIX + dateUtil.getTodayKey();
  try {
    var data = wx.getStorageSync(key);
    if (data && Array.isArray(data.sentenceIds) && data.sentenceIds.length > 0) {
      return data.sentenceIds;
    }
    return null;
  } catch (e) {
    console.error('Failed to read review cache:', e);
    return null;
  }
}

function saveTodayReview(sentenceIds) {
  var key = STORAGE_PREFIX + dateUtil.getTodayKey();
  try {
    wx.setStorageSync(key, {
      date: dateUtil.getTodayKey(),
      sentenceIds: sentenceIds
    });
  } catch (e) {
    console.error('Failed to save review cache:', e);
  }
}

function cleanOldCache() {
  try {
    var res = wx.getStorageInfoSync();
    var keys = res.keys;
    var todayKey = STORAGE_PREFIX + dateUtil.getTodayKey();
    keys.forEach(function (key) {
      if (key.indexOf(STORAGE_PREFIX) === 0 && key !== todayKey) {
        wx.removeStorageSync(key);
      }
    });
  } catch (e) {
    // 非关键操作，忽略错误
  }
}

module.exports = {
  getTodayReview: getTodayReview,
  saveTodayReview: saveTodayReview,
  cleanOldCache: cleanOldCache
};
