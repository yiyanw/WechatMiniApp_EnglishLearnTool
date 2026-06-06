var SRS_DATA_PREFIX = 'srs_data_';
var ACTIVE_ALGO_KEY = 'srs_active_algorithm';
var DEFAULT_ALGORITHM = 'weighted-random';

function getSrsData(algorithmKey) {
  try {
    var data = wx.getStorageSync(SRS_DATA_PREFIX + algorithmKey);
    if (data && typeof data === 'object') return data;
    return {};
  } catch (e) {
    return {};
  }
}

function setSrsData(algorithmKey, data) {
  try {
    wx.setStorageSync(SRS_DATA_PREFIX + algorithmKey, data);
  } catch (e) {
    console.error('Failed to save SRS data for ' + algorithmKey + ':', e);
  }
}

function getActiveAlgorithm() {
  try {
    var key = wx.getStorageSync(ACTIVE_ALGO_KEY);
    if (key && typeof key === 'string') return key;
    return DEFAULT_ALGORITHM;
  } catch (e) {
    return DEFAULT_ALGORITHM;
  }
}

function setActiveAlgorithm(key) {
  try {
    wx.setStorageSync(ACTIVE_ALGO_KEY, key);
  } catch (e) {
    console.error('Failed to save active algorithm:', e);
  }
}

module.exports = {
  getSrsData: getSrsData,
  setSrsData: setSrsData,
  getActiveAlgorithm: getActiveAlgorithm,
  setActiveAlgorithm: setActiveAlgorithm
};
