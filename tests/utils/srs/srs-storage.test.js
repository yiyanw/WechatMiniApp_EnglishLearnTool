var srsStorage;

beforeEach(function () {
  __wxResetStorage();
  jest.resetModules();
  srsStorage = require('../../../miniprogram/utils/srs/srs-storage');
});

describe('getSrsData / setSrsData', function () {
  it('returns empty object when nothing stored', function () {
    expect(srsStorage.getSrsData('weighted-random')).toEqual({});
  });

  it('roundtrips data correctly', function () {
    var data = { '1_1': 3, '2_1': 1 };
    srsStorage.setSrsData('weighted-random', data);
    expect(srsStorage.getSrsData('weighted-random')).toEqual(data);
  });

  it('isolates data by algorithm key', function () {
    srsStorage.setSrsData('algo-a', { x: 1 });
    srsStorage.setSrsData('algo-b', { y: 2 });
    expect(srsStorage.getSrsData('algo-a')).toEqual({ x: 1 });
    expect(srsStorage.getSrsData('algo-b')).toEqual({ y: 2 });
  });

  it('returns empty object for corrupted data', function () {
    wx.setStorageSync('srs_data_weighted-random', 'not an object');
    expect(srsStorage.getSrsData('weighted-random')).toEqual({});
  });
});

describe('getActiveAlgorithm / setActiveAlgorithm', function () {
  it('returns weighted-random by default', function () {
    expect(srsStorage.getActiveAlgorithm()).toBe('weighted-random');
  });

  it('roundtrips algorithm key', function () {
    srsStorage.setActiveAlgorithm('sm2');
    expect(srsStorage.getActiveAlgorithm()).toBe('sm2');
  });

  it('returns default for corrupted data', function () {
    wx.setStorageSync('srs_active_algorithm', 123);
    expect(srsStorage.getActiveAlgorithm()).toBe('weighted-random');
  });
});
