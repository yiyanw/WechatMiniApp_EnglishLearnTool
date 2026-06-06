var srs;

beforeEach(function () {
  __wxResetStorage();
  jest.resetModules();
  srs = require('../../../miniprogram/utils/srs/index');
});

describe('getActiveStrategy', function () {
  it('returns weighted-random by default', function () {
    var strategy = srs.getActiveStrategy();
    expect(strategy.key).toBe('weighted-random');
  });

  it('falls back to weighted-random for unknown stored key', function () {
    wx.setStorageSync('srs_active_algorithm', 'nonexistent');
    jest.resetModules();
    srs = require('../../../miniprogram/utils/srs/index');
    var strategy = srs.getActiveStrategy();
    expect(strategy.key).toBe('weighted-random');
  });

  it('returns strategy with full interface', function () {
    var strategy = srs.getActiveStrategy();
    expect(typeof strategy.selectCards).toBe('function');
    expect(typeof strategy.recordFeedback).toBe('function');
    expect(typeof strategy.getFeedbackOptions).toBe('function');
    expect(typeof strategy.getFeedbackLabel).toBe('function');
  });
});

describe('listStrategies', function () {
  it('includes weighted-random', function () {
    expect(srs.listStrategies()).toContain('weighted-random');
  });
});

describe('switchAlgorithm', function () {
  it('returns false for unknown algorithm', function () {
    expect(srs.switchAlgorithm('nonexistent')).toBe(false);
  });

  it('switches to a registered algorithm', function () {
    expect(srs.switchAlgorithm('weighted-random')).toBe(true);
  });
});

describe('register', function () {
  it('registers a custom strategy', function () {
    var custom = {
      create: function () {
        return {
          key: 'test-algo',
          selectCards: function () { return []; },
          recordFeedback: function () {},
          getFeedbackOptions: function () { return []; },
          getFeedbackLabel: function () { return ''; }
        };
      }
    };
    srs.register(custom);
    expect(srs.listStrategies()).toContain('test-algo');
    srs.switchAlgorithm('test-algo');
    var strategy = srs.getActiveStrategy();
    expect(strategy.key).toBe('test-algo');
  });
});
