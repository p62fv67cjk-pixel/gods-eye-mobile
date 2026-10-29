(function () {
  'use strict';

  var results = document.getElementById('results');
  var status = document.getElementById('status');
  var nativeStatus = document.getElementById('nativeStatus');
  var runButton = document.getElementById('run');
  var avplayButton = document.getElementById('avplayTest');
  var drmButton = document.getElementById('drmTest');
  var playerStage = document.getElementById('playerStage');
  var playerLabel = document.getElementById('playerLabel');

  var SAMPLE_MP4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  var SAMPLE_DASH = 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd';

  function errText(e) {
    if (!e) return 'unknown error';
    return [e.name, e.message].filter(Boolean).join(': ') || String(e);
  }

  function typeOfPath(fn) {
    try {
      var value = fn();
      if (value === null) return 'null';
      return typeof value;
    } catch (e) {
      return 'error: ' + errText(e);
    }
  }

  function addRow(name, value, state) {
    var row = document.createElement('div');
    row.className = 'row';
    var label = document.createElement('span');
    label.textContent = name;
    var output = document.createElement('span');
    output.className = 'value ' + (state === true ? 'ok' : state === false ? 'no' : 'maybe');
    output.textContent = String(value);
    row.appendChild(label);
    row.appendChild(output);
    results.appendChild(row);
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('TIMEOUT')); }, ms);
      })
    ]);
  }

  async function testKeySystem(name) {
    if (!navigator.requestMediaKeySystemAccess) return 'NO EME API';
    var configs = [{
      initDataTypes: ['cenc'],
      audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
      videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }]
    }];
    try {
      await withTimeout(navigator.requestMediaKeySystemAccess(name, configs), 5000);
      return 'AVAILABLE';
    } catch (e) {
      return e && e.message === 'TIMEOUT' ? 'TIMEOUT' : 'UNAVAILABLE: ' + errText(e);
    }
  }

  function safeAppInfo() {
    try {
      if (!window.tizen || !tizen.application) return null;
      var app = tizen.application.getCurrentApplication();
      var info = app && app.appInfo;
      if (!info) return 'application API present';
      return (info.id || 'unknown id') + ' / ' + (info.version || 'unknown version');
    } catch (e) {
      return 'error: ' + errText(e);
    }
  }

  function safeCapability(name) {
    try {
      if (!window.tizen || !tizen.systeminfo || !tizen.systeminfo.getCapability) return 'not exposed';
      return String(tizen.systeminfo.getCapability(name));
    } catch (e) {
      return 'error: ' + errText(e);
    }
  }

  function hasAvplay() {
    try {
      return !!(window.webapis && webapis.avplay);
    } catch (e) {
      return false;
    }
  }

  function avplayVersion() {
    try {
      if (!hasAvplay() || typeof webapis.avplay.getVersion !== 'function') return 'not exposed';
      return webapis.avplay.getVersion() || 'API present';
    } catch (e) {
      return 'error: ' + errText(e);
    }
  }

  function cleanupAvplay() {
    try {
      if (!hasAvplay()) return;
      var state = webapis.avplay.getState ? webapis.avplay.getState() : 'NONE';
      if (state && state !== 'NONE') {
        try { webapis.avplay.stop(); } catch (ignore) {}
        try { webapis.avplay.close(); } catch (ignore2) {}
      }
    } catch (ignore3) {}
  }

  function setAvplayRect() {
    try {
      var rect = playerStage.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      webapis.avplay.setDisplayRect(
        Math.round(rect.left * dpr),
        Math.round(rect.top * dpr),
        Math.round(rect.width * dpr),
        Math.round(rect.height * dpr)
      );
    } catch (e) {
      playerLabel.textContent = 'Display rect: ' + errText(e);
    }
  }

  async function run() {
    runButton.disabled = true;
    status.textContent = 'Testing installed Tizen context…';
    nativeStatus.textContent = 'TESTING';
    results.innerHTML = '';

    var hasTizen = typeof window.tizen !== 'undefined';
    var hasWebapis = typeof window.webapis !== 'undefined';
    var avplay = hasAvplay();
    var hasProductInfo = false;
    try { hasProductInfo = !!(window.webapis && webapis.productinfo); } catch (ignore) {}

    addRow('User agent', navigator.userAgent, null);
    addRow('Screen', screen.width + ' × ' + screen.height + ' @ ' + (window.devicePixelRatio || 1) + 'x', null);
    addRow('window.tizen', typeOfPath(function(){ return window.tizen; }), hasTizen);
    addRow('Tizen application API', typeOfPath(function(){ return window.tizen && tizen.application; }), !!(window.tizen && tizen.application));
    addRow('Current app', safeAppInfo() || 'not exposed', !!safeAppInfo());
    addRow('Tizen systeminfo API', typeOfPath(function(){ return window.tizen && tizen.systeminfo; }), !!(window.tizen && tizen.systeminfo));
    addRow('window.webapis', typeOfPath(function(){ return window.webapis; }), hasWebapis);
    addRow('webapis.avplay', avplay ? 'AVAILABLE' : 'not exposed', avplay);
    addRow('AVPlay version', avplayVersion(), avplay);
    addRow('AVPlay open()', avplay && typeof webapis.avplay.open === 'function' ? 'AVAILABLE' : 'not exposed', avplay && typeof webapis.avplay.open === 'function');
    addRow('AVPlay prepareAsync()', avplay && typeof webapis.avplay.prepareAsync === 'function' ? 'AVAILABLE' : 'not exposed', avplay && typeof webapis.avplay.prepareAsync === 'function');
    addRow('AVPlay setDrm()', avplay && typeof webapis.avplay.setDrm === 'function' ? 'AVAILABLE' : 'not exposed', avplay && typeof webapis.avplay.setDrm === 'function');
    addRow('webapis.productinfo', hasProductInfo ? 'AVAILABLE' : 'not exposed', hasProductInfo);
    addRow('EME API', typeof navigator.requestMediaKeySystemAccess, typeof navigator.requestMediaKeySystemAccess === 'function');
    addRow('MediaSource', typeof window.MediaSource, typeof window.MediaSource === 'function');

    var video = document.createElement('video');
    addRow('H.264/AAC', video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') || 'no', !!video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'));
    addRow('Native HLS', video.canPlayType('application/vnd.apple.mpegurl') || 'no', !!video.canPlayType('application/vnd.apple.mpegurl'));
    addRow('Tizen Wi-Fi capability', safeCapability('http://tizen.org/feature/network.wifi'), null);
    addRow('Tizen screen capability', safeCapability('http://tizen.org/feature/screen'), null);

    var clearKey = await testKeySystem('org.w3.clearkey');
    addRow('EME ClearKey', clearKey, clearKey === 'AVAILABLE');
    var widevine = await testKeySystem('com.widevine.alpha');
    addRow('EME Widevine', widevine, widevine === 'AVAILABLE');
    var playready = await testKeySystem('com.microsoft.playready');
    addRow('EME PlayReady', playready, playready === 'AVAILABLE');

    avplayButton.disabled = !avplay;
    drmButton.disabled = !(avplay && typeof webapis.avplay.setDrm === 'function');

    if (avplay && typeof webapis.avplay.setDrm === 'function') {
      nativeStatus.textContent = 'DRM API FOUND';
      nativeStatus.className = 'status-pill success';
      status.textContent = 'Native AVPlay + DRM entrypoint detected';
    } else if (hasTizen || hasWebapis) {
      nativeStatus.textContent = 'NATIVE FOUND';
      nativeStatus.className = 'status-pill partial';
      status.textContent = 'Native APIs detected, DRM player not yet exposed';
    } else {
      nativeStatus.textContent = 'SANDBOXED';
      nativeStatus.className = 'status-pill fail';
      status.textContent = 'No native globals exposed';
    }
    runButton.disabled = false;
  }

  function testAvplayVideo() {
    if (!hasAvplay()) return;
    cleanupAvplay();
    playerStage.hidden = false;
    playerLabel.textContent = 'Opening public H.264 test video…';
    status.textContent = 'Testing Samsung AVPlay video path…';

    try {
      webapis.avplay.open(SAMPLE_MP4);
      setAvplayRect();
      webapis.avplay.setListener({
        onbufferingstart: function(){ playerLabel.textContent = 'Buffering…'; },
        onbufferingprogress: function(p){ playerLabel.textContent = 'Buffering ' + p + '%'; },
        onbufferingcomplete: function(){ playerLabel.textContent = 'AVPlay video is running'; },
        onstreamcompleted: function(){ cleanupAvplay(); playerStage.hidden = true; status.textContent = 'AVPlay playback completed'; },
        onerror: function(e){ playerLabel.textContent = 'AVPlay error: ' + e; status.textContent = 'AVPlay playback failed'; },
        onerrormsg: function(e, msg){ playerLabel.textContent = 'AVPlay error: ' + e + ' ' + msg; },
        ondrmevent: function(type, data){ playerLabel.textContent = 'DRM event: ' + type + ' ' + (data && data.name ? data.name : ''); }
      });
      webapis.avplay.prepareAsync(function(){
        try {
          webapis.avplay.play();
          playerLabel.textContent = 'AVPlay video is running';
          status.textContent = 'AVPlay playback works';
          setTimeout(function(){
            cleanupAvplay();
            playerStage.hidden = true;
            status.textContent = 'AVPlay test passed';
          }, 8000);
        } catch (e) {
          playerLabel.textContent = 'Play failed: ' + errText(e);
        }
      }, function(e){
        playerLabel.textContent = 'Prepare failed: ' + errText(e);
        status.textContent = 'AVPlay prepare failed';
      });
    } catch (e) {
      playerLabel.textContent = 'Open failed: ' + errText(e);
      status.textContent = 'AVPlay open failed';
    }
  }

  function testDrmEntrypoint() {
    if (!hasAvplay() || typeof webapis.avplay.setDrm !== 'function') return;
    cleanupAvplay();
    status.textContent = 'Testing DRM modules without requesting a commercial licence…';
    playerStage.hidden = false;
    playerLabel.textContent = 'Initialising DRM entrypoints…';

    var messages = [];
    try {
      webapis.avplay.open(SAMPLE_DASH);
      try {
        webapis.avplay.setListener({
          ondrmevent: function(type, data){ messages.push('event ' + type + ':' + (data && data.name ? data.name : '')); },
          onerror: function(e){ messages.push('player ' + e); },
          onerrormsg: function(e, msg){ messages.push('player ' + e + ':' + msg); }
        });
      } catch (ignore) {}

      try {
        var w = webapis.avplay.setDrm('WIDEVINE_CDM', 'SetProperties', JSON.stringify({
          AppSession: 'godseye-probe-' + Date.now(),
          DataType: 'MPEG-DASH'
        }));
        messages.push('Widevine init: ' + (w || 'accepted'));
      } catch (e1) {
        messages.push('Widevine: ' + errText(e1));
      }

      cleanupAvplay();
      webapis.avplay.open(SAMPLE_DASH);
      try {
        var p = webapis.avplay.setDrm('PLAYREADY', 'SetProperties', JSON.stringify({
          DeleteLicenseAfterUse: true,
          GetChallenge: true
        }));
        messages.push('PlayReady init: ' + (p || 'accepted'));
      } catch (e2) {
        messages.push('PlayReady: ' + errText(e2));
      }

      cleanupAvplay();
      playerLabel.textContent = messages.join(' | ');
      addRow('AVPlay DRM entrypoint', messages.join(' | '), messages.some(function(m){ return m.indexOf('accepted') !== -1; }));
      status.textContent = 'DRM entrypoint test complete';
    } catch (e) {
      cleanupAvplay();
      playerLabel.textContent = 'DRM probe failed: ' + errText(e);
      addRow('AVPlay DRM entrypoint', errText(e), false);
      status.textContent = 'DRM entrypoint test failed';
    }
  }

  document.getElementById('services').addEventListener('click', function(e){
    var button = e.target.closest ? e.target.closest('button[data-url]') : null;
    if (!button) return;
    var url = button.getAttribute('data-url');
    status.textContent = 'Opening official player…';
    try {
      var opened = window.open(url, '_blank');
      if (!opened) window.location.href = url;
    } catch (err) {
      window.location.href = url;
    }
  });

  runButton.addEventListener('click', run);
  avplayButton.addEventListener('click', testAvplayVideo);
  drmButton.addEventListener('click', testDrmEntrypoint);
  window.addEventListener('resize', function(){ if (!playerStage.hidden && hasAvplay()) setAvplayRect(); });
  window.addEventListener('beforeunload', cleanupAvplay);
  window.addEventListener('load', run);
})();
