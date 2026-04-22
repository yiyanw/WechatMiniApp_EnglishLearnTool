var storage = {};

global.wx = {
  getStorageSync: jest.fn(function (key) {
    return storage[key];
  }),
  setStorageSync: jest.fn(function (key, value) {
    storage[key] = value;
  }),
  removeStorageSync: jest.fn(function (key) {
    delete storage[key];
  }),
  getStorageInfoSync: jest.fn(function () {
    return { keys: Object.keys(storage) };
  }),
  createInnerAudioContext: jest.fn(function () {
    return {
      src: '',
      startTime: 0,
      currentTime: 0,
      playbackRate: 1.0,
      obeyMuteSwitch: true,
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      seek: jest.fn(),
      destroy: jest.fn(),
      onError: jest.fn(),
      onEnded: jest.fn(),
      onTimeUpdate: jest.fn(),
      onCanplay: jest.fn(),
      offCanplay: jest.fn(),
    };
  }),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  cloud: {
    callFunction: jest.fn(),
  },
};

global.__wxMockStorage = storage;
global.__wxResetStorage = function () {
  Object.keys(storage).forEach(function (k) { delete storage[k]; });
  jest.clearAllMocks();
};
