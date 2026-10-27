from pathlib import Path

p = Path('index.html')
s = p.read_text()

if 'id="voiceBtn"' in s and 'id="cctvBtn"' in s:
    print('Gods Eye v2 already applied')
    raise SystemExit(0)

def rep(old, new):
    global s
    if old not in s:
        raise SystemExit(f'Missing marker: {old[:80]!r}')
    s = s.replace(old, new, 1)

rep('grid-template-columns:repeat(4,1fr); gap:8px;', 'grid-template-columns:repeat(5,1fr); gap:6px;')

rep('    .toggleline button { border:0; border-radius:999px; padding:8px 11px; background:#172231; color:var(--text); font-weight:700; }\n', '''    .toggleline button { border:0; border-radius:999px; padding:8px 11px; background:#172231; color:var(--text); font-weight:700; }\n    .cameraView { width:100%; aspect-ratio:16/9; background:#020407; border-radius:16px; overflow:hidden; border:1px solid var(--line); margin-top:12px; }\n    .cameraView video { width:100%; height:100%; object-fit:contain; background:#000; }\n    .voiceListening { background:rgba(255,80,110,.22) !important; outline:1px solid rgba(255,120,140,.55); }\n''')

rep('    <button class="pill" id="settingsBtn" aria-label="Settings">⚙︎</button>\n', '    <button class="pill" id="voiceBtn" aria-label="Voice control">🎙️</button>\n    <button class="pill" id="settingsBtn" aria-label="Settings">⚙︎</button>\n')

rep('    <button class="btn" id="photoBtn"><span>▦</span>3D CITY</button>\n', '    <button class="btn" id="photoBtn"><span>▦</span>3D CITY</button>\n    <button class="btn" id="cctvBtn"><span>📹</span>CCTV</button>\n')

cctv_sheet = '''\n  <div class="sheetWrap" id="cctvSheet">\n    <div class="sheet">\n      <div class="handle"></div>\n      <h2>CCTV viewer</h2>\n      <p>View a camera you own, are authorised to access, or a public webcam. On iPhone, HLS streams ending in <b>.m3u8</b> work best. RTSP links need to be converted to HLS or WebRTC first.</p>\n      <label for="cameraUrl">Camera stream URL</label>\n      <input id="cameraUrl" inputmode="url" autocomplete="off" placeholder="https://example.com/live/stream.m3u8" />\n      <div class="row">\n        <button class="action secondary" id="stopCamera">Stop</button>\n        <button class="action" id="loadCamera">View camera</button>\n      </div>\n      <div class="cameraView">\n        <video id="cameraVideo" controls playsinline webkit-playsinline></video>\n      </div>\n      <p class="mini">God's Eye does not bypass camera passwords or discover private cameras. Use only feeds you are permitted to view.</p>\n      <div class="row">\n        <button class="action secondary" data-close="cctvSheet">Done</button>\n      </div>\n    </div>\n  </div>\n\n'''
rep('  <div class="sheetWrap" id="settingsSheet">\n', cctv_sheet + '  <div class="sheetWrap" id="settingsSheet">\n')

js = r'''

// CCTV viewer: authorised/private-owner/public feeds only.
const cameraVideo = document.getElementById("cameraVideo");
document.getElementById("cctvBtn").onclick = () => openSheet("cctvSheet");
document.getElementById("loadCamera").onclick = async () => {
  const url = document.getElementById("cameraUrl").value.trim();
  if (!url) return toast("Paste a camera stream URL first");
  if (!/^https:\/\//i.test(url)) return toast("Use an HTTPS camera stream URL");
  try {
    cameraVideo.pause();
    cameraVideo.removeAttribute("src");
    cameraVideo.load();
    cameraVideo.src = url;
    await cameraVideo.play();
    toast("Camera stream opened");
  } catch (e) {
    console.error(e);
    toast("Couldn't play that feed. HLS .m3u8 works best on iPhone.");
  }
};
document.getElementById("stopCamera").onclick = () => {
  cameraVideo.pause();
  cameraVideo.removeAttribute("src");
  cameraVideo.load();
  toast("Camera stopped");
};

// Push-to-talk voice control.
let recognition = null;
let voiceActive = false;
const voiceBtn = document.getElementById("voiceBtn");

function voiceZoomIn() {
  const h = viewer.camera.positionCartographic.height;
  viewer.camera.zoomIn(Math.max(100, h * 0.35));
  viewer.scene.requestRender();
}

function voiceZoomOut() {
  const h = viewer.camera.positionCartographic.height;
  viewer.camera.zoomOut(Math.max(100, h * 0.7));
  viewer.scene.requestRender();
}

async function handleVoiceCommand(raw) {
  const text = (raw || "").toLowerCase().trim();
  if (!text) return;
  subline.textContent = `Heard: ${raw}`;
  toast(`Heard: “${raw}”`, 1800);

  if (text.includes("show my location") || text === "my location" || text.includes("where am i")) {
    document.getElementById("locateBtn").click();
    return;
  }
  if (text.includes("world view") || text === "world" || text.includes("show the world")) {
    document.getElementById("homeBtn").click();
    toast("World view");
    return;
  }
  if (text.includes("open cctv") || text.includes("show cctv") || text.includes("camera view")) {
    openSheet("cctvSheet");
    return;
  }
  if (text.includes("turn on 3d") || text.includes("enable 3d") || text.includes("3d city")) {
    await enablePhoto3D();
    return;
  }
  if (text.includes("turn off 3d") || text.includes("disable 3d")) {
    disablePhoto3D();
    return;
  }
  if (text.includes("zoom in")) {
    voiceZoomIn();
    toast("Zooming in");
    return;
  }
  if (text.includes("zoom out")) {
    voiceZoomOut();
    toast("Zooming out");
    return;
  }

  const prefixes = ["take me to ", "go to ", "fly to ", "search for ", "show me ", "find "];
  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) {
      const place = raw.slice(prefix.length).trim();
      if (place) {
        document.getElementById("searchInput").value = place;
        document.getElementById("goSearch").click();
      }
      return;
    }
  }

  if (text.split(/\s+/).length <= 8) {
    document.getElementById("searchInput").value = raw;
    document.getElementById("goSearch").click();
  } else {
    toast("Try: Go to Sydney, World view, Zoom in, or Open CCTV.", 3500);
  }
}

function makeRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = navigator.language || "en-AU";
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.continuous = false;
  r.onstart = () => {
    voiceActive = true;
    voiceBtn.classList.add("voiceListening");
    voiceBtn.textContent = "⏹";
    toast("Listening…");
  };
  r.onend = () => {
    voiceActive = false;
    voiceBtn.classList.remove("voiceListening");
    voiceBtn.textContent = "🎙️";
  };
  r.onerror = e => {
    console.error(e);
    if (e.error !== "aborted") toast(`Voice error: ${e.error || "not available"}`);
  };
  r.onresult = e => handleVoiceCommand(e.results[0][0].transcript);
  return r;
}

voiceBtn.onclick = async () => {
  if (voiceActive && recognition) {
    recognition.stop();
    return;
  }
  try {
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      stream.getTracks().forEach(t => t.stop());
    }
  } catch (e) {
    console.error(e);
    toast("Microphone permission is required for voice control.");
    return;
  }

  recognition = makeRecognition();
  if (!recognition) {
    toast("Speech recognition isn't available in this iPhone browser.");
    return;
  }
  try { recognition.start(); }
  catch (e) { console.error(e); toast("Couldn't start voice control."); }
};
'''

rep('document.getElementById("photoBtn").onclick = () => photoEnabled ? disablePhoto3D() : enablePhoto3D();\n', 'document.getElementById("photoBtn").onclick = () => photoEnabled ? disablePhoto3D() : enablePhoto3D();\n' + js + '\n')

p.write_text(s)
print('Applied Gods Eye v2 voice + CCTV patch')
