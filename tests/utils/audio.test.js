var { createAudioMixin } = require('../../miniprogram/utils/audio');

var mockPage;
var mixer;
var mockAudio;

beforeEach(function () {
  __wxResetStorage();
  mockPage = {
    data: { playingId: null },
    setData: jest.fn(function (obj) {
      Object.assign(mockPage.data, obj);
    }),
  };
  mixer = createAudioMixin(mockPage, 'https://example.com/audio.m4a');
  mixer.initAudio();
  mockAudio = mixer._audio;
});

afterEach(function () {
  mixer.destroyAudio();
});

describe('createAudioMixin', function () {
  it('creates a mixin with expected methods', function () {
    expect(typeof mixer.initAudio).toBe('function');
    expect(typeof mixer.destroyAudio).toBe('function');
    expect(typeof mixer.handlePlay).toBe('function');
    expect(typeof mixer.playSentence).toBe('function');
    expect(typeof mixer.stopPlayback).toBe('function');
  });

  it('initAudio creates an audio context', function () {
    expect(mixer._audio).toBeTruthy();
    expect(wx.createInnerAudioContext).toHaveBeenCalled();
  });

  it('initAudio sets obeyMuteSwitch to false', function () {
    expect(mockAudio.obeyMuteSwitch).toBe(false);
  });

  it('initAudio registers event handlers', function () {
    expect(mockAudio.onError).toHaveBeenCalled();
    expect(mockAudio.onEnded).toHaveBeenCalled();
    expect(mockAudio.onTimeUpdate).toHaveBeenCalled();
  });
});

describe('destroyAudio', function () {
  it('stops and destroys the audio context', function () {
    mixer.destroyAudio();
    expect(mockAudio.stop).toHaveBeenCalled();
    expect(mockAudio.destroy).toHaveBeenCalled();
    expect(mixer._audio).toBeNull();
  });

  it('resets playingId and playbackRate', function () {
    mockPage.data.playingId = '1_1';
    mixer.setPlaybackRate(0.6);
    mixer.destroyAudio();
    expect(mixer._playbackRate).toBe(1.0);
    expect(mockPage.setData).toHaveBeenCalledWith({ playingId: null, playbackRate: 1.0 });
  });
});

describe('handlePlay', function () {
  var items = [
    { id: '1_1', en: 'Hello', zh: '你好', start: 10, end: 15 },
    { id: '1_2', en: 'World', zh: '世界', start: 20, end: 25 },
  ];

  it('plays a sentence by id', function () {
    mixer.handlePlay('1_1', items);
    expect(mockPage.setData).toHaveBeenCalledWith({ playingId: '1_1' });
    expect(mixer._currentSentence).toEqual(items[0]);
  });

  it('stops playback when clicking the same id', function () {
    mockPage.data.playingId = '1_1';
    mixer.handlePlay('1_1', items);
    expect(mockAudio.stop).toHaveBeenCalled();
    expect(mixer._currentSentence).toBeNull();
  });

  it('rejects sentence with invalid time range', function () {
    var badItems = [{ id: 'x', en: 'bad', zh: 'bad', start: 10, end: 10 }];
    mixer.handlePlay('x', badItems);
    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '数据异常' })
    );
  });

  it('does nothing for unknown id', function () {
    mixer.handlePlay('unknown', items);
    expect(mockPage.setData).not.toHaveBeenCalled();
  });
});

describe('stopPlayback', function () {
  it('stops audio and clears state when stopAudio is true', function () {
    mixer._currentSentence = { id: '1_1' };
    mockPage.data.playingId = '1_1';
    mixer.stopPlayback(true);
    expect(mockAudio.stop).toHaveBeenCalled();
    expect(mixer._currentSentence).toBeNull();
    expect(mockPage.setData).toHaveBeenCalledWith({ playingId: null });
  });

  it('only clears state when stopAudio is false', function () {
    mixer._currentSentence = { id: '1_1' };
    mockPage.data.playingId = '1_1';
    mixer.stopPlayback(false);
    expect(mockAudio.stop).not.toHaveBeenCalled();
    expect(mixer._currentSentence).toBeNull();
    expect(mockPage.setData).toHaveBeenCalledWith({ playingId: null });
  });

  it('skips setData if playingId is already null', function () {
    mockPage.data.playingId = null;
    mixer.stopPlayback(true);
    expect(mockPage.setData).not.toHaveBeenCalled();
  });
});

describe('setPlaybackRate', function () {
  it('stores the rate and applies to audio', function () {
    mixer.setPlaybackRate(0.6);
    expect(mixer._playbackRate).toBe(0.6);
    expect(mockAudio.playbackRate).toBe(0.6);
  });

  it('updates page data', function () {
    mixer.setPlaybackRate(0.8);
    expect(mockPage.setData).toHaveBeenCalledWith({ playbackRate: 0.8 });
  });

  it('defaults to 1.0', function () {
    expect(mixer._playbackRate).toBe(1.0);
  });
});

describe('cycleSpeed', function () {
  it('cycles 1.0 -> 0.8 -> 0.6 -> 1.0', function () {
    expect(mixer._playbackRate).toBe(1.0);
    mixer.cycleSpeed();
    expect(mixer._playbackRate).toBe(0.8);
    mixer.cycleSpeed();
    expect(mixer._playbackRate).toBe(0.6);
    mixer.cycleSpeed();
    expect(mixer._playbackRate).toBe(1.0);
  });
});

describe('_doPlay', function () {
  it('sets startTime and plays after canplay when src matches', function () {
    mockAudio.src = 'https://example.com/audio.m4a';
    mixer._audioReady = true;
    mixer._doPlay('https://example.com/audio.m4a', 10.5);
    expect(mixer._audioReady).toBe(false);
    expect(mockAudio.startTime).toBe(10.5);
    expect(mockAudio.play).not.toHaveBeenCalled();
    var canplayCb = mockAudio.onCanplay.mock.calls[mockAudio.onCanplay.mock.calls.length - 1][0];
    canplayCb();
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('sets new src and startTime when src differs', function () {
    mockAudio.src = 'https://other.com/old.m4a';
    mixer._doPlay('https://example.com/new.m4a', 5.0);
    expect(mockAudio.src).toBe('https://example.com/new.m4a');
    expect(mixer._audioReady).toBe(false);
    expect(mockAudio.startTime).toBe(5.0);
    expect(mockAudio.play).not.toHaveBeenCalled();
    var canplayCb = mockAudio.onCanplay.mock.calls[mockAudio.onCanplay.mock.calls.length - 1][0];
    canplayCb();
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('applies playbackRate before playing', function () {
    mockAudio.src = 'https://example.com/audio.m4a';
    mixer._audioReady = true;
    mixer.setPlaybackRate(0.8);
    mixer._doPlay('https://example.com/audio.m4a', 0);
    expect(mockAudio.playbackRate).toBe(0.8);
    var canplayCb = mockAudio.onCanplay.mock.calls[mockAudio.onCanplay.mock.calls.length - 1][0];
    canplayCb();
    expect(mockAudio.play).toHaveBeenCalled();
  });
});

describe('onTimeUpdate callback', function () {
  it('clears state when currentTime >= end', function () {
    var timeUpdateCb = mockAudio.onTimeUpdate.mock.calls[0][0];
    mixer._currentSentence = { id: '1_1', start: 10, end: 15 };
    mockPage.data.playingId = '1_1';
    mockAudio.currentTime = 15.1;
    timeUpdateCb();
    expect(mixer._currentSentence).toBeNull();
    expect(mockPage.setData).toHaveBeenCalledWith({ playingId: null });
  });

  it('does nothing when no current sentence', function () {
    var timeUpdateCb = mockAudio.onTimeUpdate.mock.calls[0][0];
    mixer._currentSentence = null;
    timeUpdateCb();
    expect(mockPage.setData).not.toHaveBeenCalled();
  });
});

describe('onEnded callback', function () {
  it('clears state when audio ends', function () {
    var endedCb = mockAudio.onEnded.mock.calls[0][0];
    mixer._currentSentence = { id: '1_1' };
    mockPage.data.playingId = '1_1';
    endedCb();
    expect(mixer._currentSentence).toBeNull();
    expect(mockPage.setData).toHaveBeenCalledWith({ playingId: null });
  });
});
