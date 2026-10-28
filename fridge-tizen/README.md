# Family Hub Native Probe

Minimal packaged Tizen Web app for the Samsung Family Hub Tizen 7.0 refrigerator.

## Purpose

This app answers one question: does an installed Tizen application receive native APIs that Samsung Internet hides from ordinary webpages?

It reports:
- `window.tizen`
- Tizen Application and SystemInfo APIs
- `window.webapis`
- `webapis.avplay`
- `webapis.productinfo`
- EME / MediaSource / fullscreen
- ClearKey, Widevine and PlayReady key-system responses

## Project

The Tizen project root is this `fridge-tizen` folder. `config.xml` targets Tizen 7.0, portrait/fullscreen, and requests only Internet access.

## Packaging and signing

A real installable `.wgt` must be signed. Samsung/Tizen signing is intentionally not stored in this public repository.

After importing the project into Tizen Studio and creating the appropriate Samsung/Tizen certificate profile for the Family Hub device, build/sign the Web application and install it on the authorized device.

The certificate profile and device authorization are the only parts that cannot be generated from this repository alone because they are bound to the developer identity and target device.
