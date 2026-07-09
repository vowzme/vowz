# PWA Icon & Splash — Real-Device QA

Adaptive launcher icons and splash screens only render on real installed
devices. Chrome/Safari previews, iframes, and desktop tabs can't reproduce
launcher masking or cold-launch splash. Run this checklist before shipping
any change under `public/icons/` or the icon section of
`public/manifest.webmanifest`.

Before starting, run `bun run validate:icons` locally — it catches size,
shape, and safe-zone regressions without a phone.

## Device matrix

Test at least one device per launcher mask family. The three Android rows
cover the mask shapes Chrome composes adaptive icons against; the two iOS
rows cover the two apple-touch-icon sizes actually shipped by current
hardware.

| Platform            | Device example                | Mask / splash trait to verify        |
| ------------------- | ----------------------------- | ------------------------------------ |
| Android — Pixel     | Pixel 7 / 8 (Android 14+)     | Circle mask, Material You splash     |
| Android — Samsung   | Galaxy S22 / S23 (One UI 6/7) | Squircle mask, One UI splash         |
| Android — OEM other | OnePlus / Xiaomi / Realme     | Teardrop or rounded-square mask      |
| iOS — phone         | iPhone 13 / 14 / 15           | 180px apple-touch-icon, dark splash  |
| iOS — tablet        | iPad (any current)            | 167px apple-touch-icon, wide splash  |

## Steps

### Android (Chrome)

1. Open `https://vowz.me` in Chrome. Not Samsung Internet, not an in-app
   webview.
2. Menu → **Install app** → **Install**. If you only see "Add shortcut",
   hard-reload and retry.
3. Fully close Chrome, then tap the Vowz icon from the home screen and app
   drawer.

### iOS (Safari)

1. Open `https://vowz.me` in Safari. Not Chrome, not an in-app browser.
2. Share → **Add to Home Screen** → **Add**.
3. Swipe Safari away, then tap the Vowz icon from the home screen.

## Expected appearance

**Launcher icon**

- Full logo visible on every mask shape. No crop at any edge.
- Solid navy `#001F3F` background fills the entire mask (no white halo,
  no transparent corners).
- Icon is centered; logo occupies ~50% of the canvas, which sits well
  inside Android's 80% safe zone.

**Splash / launch screen**

- Cold launch shows navy `#001F3F` background for ~1s.
- Icon is centered on the splash.
- Status bar is navy (Android theme color / iOS `black-translucent`).

**Standalone chrome**

- No browser URL bar once launched from the home screen.
- Back gesture / system nav works; no Chrome or Safari UI leaks in.

## If something looks wrong

- **Old icon still showing after reinstall** → the OS cached the previous
  manifest. Uninstall, clear site data for `vowz.me` in the browser, then
  reinstall.
- **Logo clipped on one launcher only** → that launcher masks beyond 80%.
  Bump the shared `?v=` query on the icon entries in
  `public/manifest.webmanifest` and reinstall so the browser refetches.
- **White splash instead of navy** → stale manifest. Same uninstall +
  clear-site-data + reinstall fix.
- **No install prompt on Android** → not yet PWA-eligible in this session.
  Reload once, interact with the page, retry the menu.

Reinstall is the only reliable fix for installed-app icon/splash issues —
iOS and Android freeze `start_url`, `id`, `scope`, `display`, and the icon
set at install time.