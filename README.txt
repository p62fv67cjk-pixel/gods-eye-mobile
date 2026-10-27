GOD'S EYE MOBILE — iPhone Web App

What this is
- A Safari-based 3D globe app made for iPhone.
- Uses CesiumJS.
- Supports Cesium ion tokens and Google Photorealistic 3D Tiles.
- Token is stored in localStorage on the device/browser.

Files
- index.html
- manifest.webmanifest
- sw.js
- icon.svg

How to use
1. Host these files on any HTTPS static host (GitHub Pages, Cloudflare Pages, Netlify, etc.).
2. Open the hosted URL in Safari on iPhone.
3. Tap Share -> Add to Home Screen.
4. Open God's Eye from the Home Screen.
5. Tap the gear icon and paste your Cesium ion token.
6. Tap "3D CITY" to load photorealistic 3D tiles.

Notes
- iPhone Home Screen installation requires the app to be served over HTTPS.
- 3D tiles require network access and a Cesium ion token with the needed permissions.
