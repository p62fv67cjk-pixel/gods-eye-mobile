(function () {
  'use strict';

  var results = document.getElementById('results');
  var status = document.getElementById('status');
  var runButton = document.getElementById('run');

  function typeOfPath(fn) {
    try {
      var value = fn();
      if (value === null) return 'null';
      return typeof value;
    } catch (e) {
      return 'error: ' + (e && e.name ? e.name : String(e));
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
      await withTimeout(navigator.requestMediaKeySystemAccess(name, configs), 4000);
      return 'AVAILABLE';
    } catch (e) {
      return e && e.message === 'TIMEOUT' ? 'TIMEOUT' : 'UNAVAILABLE';
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
      return 'error: ' + (e.name || e.message || e);
    }
  }

  function safeCapability(name) {
    try {
      if (!window.tizen || !tizen.systeminfo || !tizen.systeminfo.getCapability) return 'not exposed';
      return String(tizen.systeminfo.getCapability(name));
    } catch (e) {
      return 'error: ' + (e.name || e.message || e);
    }
  }

  async function run() {
    runButton.disabled = true;
    status.textContent = 'Testing native app context…';
    results.innerHTML = '';

    var hasTizen = typeof window.tizen !== 'undefined';
    var hasWebapis = typeof window.webapis !== 'undefined';
    var hasAvplay = !!(window.webapis && webapis.avplay);
    var hasProductInfo = !!(window.webapis && webapis.productinfo);

    addRow('User agent', navigator.userAgent, null);
    addRow('Screen', screen.width + ' × ' + screen.height + ' @ ' + (window.devicePixelRatio || 1) + 'x', null);
    addRow('window.tizen', typeOfPath(function(){ return window.tizen; }), hasTizen);
    addRow('Tizen application API', typeOfPath(function(){ return window.tizen && tizen.application; }), !!(window.tizen && tizen.application));
    addRow('Current app', safeAppInfo() || 'not exposed', !!safeAppInfo());
    addRow('Tizen systeminfo API', typeOfPath(function(){ return window.tizen && tizen.systeminfo; }), !!(window.tizen && tizen.systeminfo));
    addRow('window.webapis', typeOfPath(function(){ return window.webapis; }), hasWebapis);
    addRow('webapis.avplay', hasAvplay ? 'AVAILABLE' : 'not exposed', hasAvplay);
    addRow('webapis.productinfo', hasProductInfo ? 'AVAILABLE' : 'not exposed', hasProductInfo);
    addRow('EME API', typeof navigator.requestMediaKeySystemAccess, typeof navigator.requestMediaKeySystemAccess === 'function');
    addRow('MediaSource', typeof window.MediaSource, typeof window.MediaSource === 'function');
    addRow('Fullscreen', String(!!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)), !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen));
    addRow('Tizen Wi-Fi capability', safeCapability('http://tizen.org/feature/network.wifi'), null);
    addRow('Tizen screen capability', safeCapability('http://tizen.org/feature/screen'), null);

    var clearKey = await testKeySystem('org.w3.clearkey');
    addRow('ClearKey', clearKey, clearKey === 'AVAILABLE');
    var widevine = await testKeySystem('com.widevine.alpha');
    addRow('Widevine', widevine, widevine === 'AVAILABLE');
    var playready = await testKeySystem('com.microsoft.playready');
    addRow('PlayReady', playready, playready === 'AVAILABLE');

    if (hasTizen || hasWebapis) {
      status.textContent = 'Native app APIs detected';
    } else {
      status.textContent = 'No native globals exposed';
    }
    runButton.disabled = false;
  }

  runButton.addEventListener('click', run);
  window.addEventListener('load', run);
})();
