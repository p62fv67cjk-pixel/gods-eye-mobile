from pathlib import Path

p = Path('index.html')
s = p.read_text()

marker = '<label for="cameraUrl">Camera stream URL</label>'
insert = '''<div class="toggleline" id="orangePresetBlock">
          <div><b>Orange NSW public camera</b><div class="mini">Current public live-snapshot source</div></div>
          <button id="orangePublicCam">Open</button>
        </div>
        <div class="toggleline">
          <div><b>Live Traffic NSW cameras</b><div class="mini">Official NSW camera map and snapshots</div></div>
          <button id="orangeLiveTraffic">Open</button>
        </div>
        <p class="mini">Orange's currently verified public camera is a periodically refreshed still image, not a continuous video stream. Mobile speed-camera locations are not watchable CCTV feeds.</p>
      '''

if 'id="orangePresetBlock"' not in s and marker in s:
    s = s.replace(marker, insert + marker, 1)

js = '''\n// Orange NSW verified public camera sources\ndocument.getElementById("orangePublicCam")?.addEventListener("click", () => {\n  window.open("https://argosatlas.com/en/cameras/australia/nsw/", "_blank", "noopener,noreferrer");\n});\ndocument.getElementById("orangeLiveTraffic")?.addEventListener("click", () => {\n  window.open("https://www.livetraffic.com/", "_blank", "noopener,noreferrer");\n});\n'''

if 'Orange NSW verified public camera sources' not in s:
    s = s.replace('</script>', js + '\n</script>', 1)

p.write_text(s)
