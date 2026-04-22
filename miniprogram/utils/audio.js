var _tempUrlMap = {};
var SPEEDS = [1.0, 0.8, 0.6];

function createAudioMixin(page, audioUrl) {
  return {
    _audio: null,
    _currentSentence: null,
    _playbackRate: 1.0,

    initAudio: function () {
      var self = this;
      var audio = wx.createInnerAudioContext();
      audio.obeyMuteSwitch = false;

      audio.onError(function (err) {
        var code = (err && err.errCode) || (err && err.errMsg) || 'unknown';
        console.error('Audio error:', err);
        wx.showToast({ title: '音频播放出错(' + code + ')', icon: 'none', duration: 2000 });
        self.stopPlayback();
      });

      audio.onEnded(function () {
        self.stopPlayback();
      });

      audio.onTimeUpdate(function () {
        if (!self._currentSentence) return;
        if (audio.currentTime >= self._currentSentence.end) {
          self.stopPlayback();
        }
      });

      self._audio = audio;
    },

    destroyAudio: function () {
      if (this._audio) {
        this._audio.stop();
        this._audio.destroy();
        this._audio = null;
      }
      this._currentSentence = null;
      this._playbackRate = 1.0;
      page.setData({ playingId: null, playbackRate: 1.0 });
    },

    preloadAudio: function () {
      var self = this;
      if (!audioUrl || audioUrl.indexOf('cloud://') !== 0 || _tempUrlMap[audioUrl]) return;
      wx.showLoading({ title: '加载中...', mask: true });
      self.resolveUrl(audioUrl, function (httpUrl) {
        self._preloadAudioFile(httpUrl);
      });
    },

    _preloadAudioFile: function (url) {
      var audio = this._audio;
      if (!audio) { wx.hideLoading(); return; }
      var onReady = function () {
        audio.offCanplay(onReady);
        wx.hideLoading();
      };
      audio.onCanplay(onReady);
      audio.src = url;
    },

    resolveUrl: function (cloudFileId, callback) {
      var self = this;
      if (_tempUrlMap[cloudFileId]) {
        callback(_tempUrlMap[cloudFileId]);
        return;
      }
      self._callGetAudioUrl(cloudFileId, callback, 1);
    },

    _callGetAudioUrl: function (cloudFileId, callback, retries) {
      var self = this;
      wx.cloud.callFunction({
        name: 'getAudioUrl',
        data: { fileID: cloudFileId },
        success: function (res) {
          if (res.result && res.result.url) {
            _tempUrlMap[cloudFileId] = res.result.url;
            callback(res.result.url);
          } else {
            var errMsg = (res.result && res.result.errMsg) || '返回为空';
            console.error('getAudioUrl failed:', res.result);
            wx.hideLoading();
            wx.showToast({ title: '获取音频地址失败: ' + errMsg, icon: 'none' });
          }
        },
        fail: function (err) {
          if (retries > 0) {
            console.warn('getAudioUrl timeout, retrying...', err);
            self._callGetAudioUrl(cloudFileId, callback, retries - 1);
            return;
          }
          var errMsg = (err && err.errMsg) || '网络异常';
          console.error('callFunction getAudioUrl failed:', err);
          wx.hideLoading();
          wx.showToast({ title: '云函数调用失败: ' + errMsg, icon: 'none' });
        }
      });
    },

    setPlaybackRate: function (rate) {
      this._playbackRate = rate;
      if (this._audio) {
        this._audio.playbackRate = rate;
      }
      page.setData({ playbackRate: rate });
    },

    cycleSpeed: function () {
      var idx = SPEEDS.indexOf(this._playbackRate);
      var next = SPEEDS[(idx + 1) % SPEEDS.length];
      this.setPlaybackRate(next);
    },

    handlePlay: function (id, sentences) {
      if (page.data.playingId === id) {
        this.stopPlayback();
        return;
      }
      var sentence = null;
      for (var i = 0; i < sentences.length; i++) {
        if (sentences[i].id === id) { sentence = sentences[i]; break; }
      }
      if (!sentence) return;
      if (sentence.start >= sentence.end) {
        wx.showToast({ title: '数据异常', icon: 'none' });
        return;
      }
      this.playSentence(sentence);
    },

    playSentence: function (sentence) {
      var audio = this._audio;
      if (!audio) return;
      var self = this;

      audio.pause();
      this._currentSentence = sentence;
      page.setData({ playingId: sentence.id });

      if (audioUrl.indexOf('cloud://') === 0) {
        self.resolveUrl(audioUrl, function (httpUrl) {
          if (self._currentSentence && self._currentSentence.id === sentence.id) {
            self._doPlay(httpUrl, sentence.start);
          }
        });
      } else {
        self._doPlay(audioUrl, sentence.start);
      }
    },

    _doPlay: function (url, startTime) {
      var audio = this._audio;
      if (!audio) return;
      audio.playbackRate = this._playbackRate;
      if (audio.src === url) {
        audio.seek(startTime);
        audio.play();
      } else {
        audio.src = url;
        audio.startTime = startTime;
        audio.play();
      }
    },

    stopPlayback: function () {
      if (this._audio) {
        this._audio.pause();
      }
      this._currentSentence = null;
      if (page.data.playingId !== null) {
        page.setData({ playingId: null });
      }
    }
  };
}

module.exports = {
  createAudioMixin: createAudioMixin
};
