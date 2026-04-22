var { getTodayKey } = require('../../miniprogram/utils/date');

describe('getTodayKey', function () {
  it('returns a string in YYYY-MM-DD format', function () {
    var result = getTodayKey();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('pads single-digit months and days with zero', function () {
    var mockDate = new Date(2025, 0, 5); // Jan 5
    jest.spyOn(global, 'Date').mockImplementation(function () {
      return mockDate;
    });
    expect(getTodayKey()).toBe('2025-01-05');
    global.Date.mockRestore();
  });

  it('handles double-digit months and days', function () {
    var mockDate = new Date(2025, 11, 25); // Dec 25
    jest.spyOn(global, 'Date').mockImplementation(function () {
      return mockDate;
    });
    expect(getTodayKey()).toBe('2025-12-25');
    global.Date.mockRestore();
  });
});
