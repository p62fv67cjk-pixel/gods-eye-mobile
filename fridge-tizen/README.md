# God's Eye Family Hub v2

Native-packaged Tizen Web application experiment for the Samsung Family Hub refrigerator running Tizen 7.0.

## Goal

Run God's Eye directly on the refrigerator with no second playback device and determine exactly which media and DRM capabilities Samsung exposes to an installed Family Hub application.

The hosted Samsung Internet page cannot answer this because its environment hides native Tizen/Samsung APIs. This package is designed to run as an installed Tizen application.

## What v2 tests

On launch the app reports:

- `window.tizen`
- Tizen Application and SystemInfo APIs
- `window.webapis`
- `webapis.avplay`
- AVPlay version and key methods
- `webapis.avplay.setDrm()`
- Samsung ProductInfo exposure
- HTML5 H.264/AAC and HLS support
- MediaSource and Encrypted Media Extensions
- ClearKey, Widevine and PlayReady EME negotiation

If Samsung AVPlay is exposed, two additional buttons become available:

1. **TEST AVPLAY VIDEO** plays a public Big Buck Bunny H.264 sample through Samsung AVPlay for eight seconds. This proves that the native hardware playback path is usable by the Family Hub application.
2. **TEST DRM ENTRYPOINT** initializes the Widevine and PlayReady AVPlay entrypoints against a public unencrypted DASH test manifest. It does not contact a commercial streaming licence server, request provider credentials, extract keys, or bypass DRM. It only determines whether Family Hub exposes the DRM modules to the application.

## Streaming launcher

The v2 shell also contains direct targets for the official web players for Netflix, Disney+, Apple TV+, Prime Video, Stan, Kayo, YouTube, ABC iview, SBS On Demand, 7plus, 9Now and 10. These are test launch points only. Whether protected playback succeeds is controlled by each provider and the capabilities exposed by the Family Hub runtime.

## Project

The Tizen project root is this `fridge-tizen` folder. `config.xml` targets Tizen 7.0, portrait/fullscreen, Internet access and Samsung's documented public DRM playback privilege so that the package can test the AVPlay DRM surface if the Family Hub product profile exposes it.

## Packaging and signing

A real installable `.wgt` must be signed with a valid Samsung/Tizen certificate accepted by the target Family Hub device. Signing credentials and device-bound distributor certificates are deliberately not stored in this public repository.

The repository's GitHub Action validates the JavaScript/XML and produces a source artifact. Final device signing/installation still depends on Samsung's supported Family Hub device authorization path.
