# Play Store PWA / TWA Device Testing Checklist

Run this on a real Android device (or `adb`-connected emulator) before every Play Console release. Covers offline behaviour, deep links, refresh, and the update prompt.

Cross-refs: [`docs/play-console-readiness.md`](./play-console-readiness.md), [`docs/pwabuilder-android.md`](./pwabuilder-android.md), [`docs/ios-pwa-reinstall-qa.md`](./ios-pwa-reinstall-qa.md).

---

## 0. Build the release web bundle

The TWA `.aab` shell loads the live web app, so what you ship on `https://vowz.me` **is** the release. Every step below must run against a build produced this way.

```bash
# 1. Clean slate
rm -rf dist node_modules/.vite
bun install

# 2. Guard rails (CI enforcement — set the env vars locally too)
VALIDATE_PLAY_RELEASE=1 bunx tsx scripts/validate-play-release.ts
bun run validate:white-glossy
bun run validate:icons

# 3. Production build (emits /sw.js, /manifest.webmanifest, /offline.html)
bun run build

# 4. Smoke-check the artifacts locally
ls dist/sw.js dist/offline.html dist/manifest.webmanifest dist/.well-known/assetlinks.json
bunx vite preview --port 4173 --host 0.0.0.0 --outDir dist
```

Publish only after all four steps succeed. Then regenerate the `.aab` in [PWABuilder](https://www.pwabuilder.com/) from `https://vowz.me` (bump `versionCode` first — see `docs/play-console-readiness.md` §6).

## 1. Install path

- [ ] Internal-testing opt-in link installs the app.
- [ ] App icon on Home Screen is glossy white (matches `bun run validate:white-glossy`).
- [ ] First launch shows the white splash for ~1s, then the Vowz home.
- [ ] **No Chrome URL bar visible** — confirms `assetlinks.json` is deployed with the correct SHA-256.
- [ ] Status bar tint matches `theme_color` (`#001F3F`).

## 2. Online baseline

- [ ] Home renders, hero image loads, fonts render correctly.
- [ ] Sign in works (Google + magic link).
- [ ] Navigate to editor → RSVP → gallery. No white flash between routes.
- [ ] DevTools remote (`chrome://inspect` on desktop → TWA process) shows Service Worker **activated and running** for scope `https://vowz.me/`.
- [ ] `Application → Cache Storage` contains `workbox-precache-v2-*`, `html`, `static-assets`, `pwa-icons`.

## 3. Offline toggle (Airplane Mode)

Enable Airplane Mode from the quick-settings panel. Do **not** kill the app.

- [ ] **Refresh current page** (pull-to-refresh or app relaunch on the same route) → page renders from cache, no error.
- [ ] Navigate to a **cached** route via in-app link → renders instantly.
- [ ] Navigate to a **fresh deep link never visited before** (paste a share link, or long-press a Home Screen shortcut) → shows `offline.html`:
  - Cream background (`#F5F5DC`), navy heading "You're offline", gold "Offline" badge, "Try again" button.
- [ ] Tapping **Try again** while still offline → stays on offline page.
- [ ] Turn Airplane Mode **off**, tap **Try again** → the real page loads.

Verified locally in this repo with a Playwright script that served `dist/offline.html` (1989 bytes) on a fresh `/deep-<random>` route after killing the preview server.

## 4. Deep-link handling

- [ ] From another app (WhatsApp, Gmail, Notes), tap `https://vowz.me/site/<slug>` → opens **inside the TWA**, not Chrome.
- [ ] Same link while offline → `offline.html` served.
- [ ] Android back gesture from a deep link returns to the previous app (not Vowz home) on cold-start deep-links.
- [ ] Share sheet from the app produces a `vowz.me` URL, not `lovable.app`.

## 5. Refresh & long-lived tabs

- [ ] Pull-to-refresh on any route → same route reloads, no 404.
- [ ] Kill the app from Recents, relaunch → last route restored via `start_url` (`/`).
- [ ] Leave the app open for 24 h, then reopen with network on → **"Update available"** sonner toast appears when a new SW is deployed. Tapping **Reload** applies the new version without reinstall.
  - The hourly `reg.update()` poll in `src/pwa/register.ts` drives this; force it locally by deploying a new build and calling `navigator.serviceWorker.getRegistration().then(r => r.update())` from `chrome://inspect`.

## 6. Storage & permissions

- [ ] First photo upload triggers the system photo picker (not a browser sheet).
- [ ] Payments open Razorpay in a Custom Tab overlay, then return to the app on success.
- [ ] Google Sign-In returns to the app (not Chrome) — confirms `assetlinks.json` covers OAuth redirects.
- [ ] App size in Settings → Apps → Vowz stays under ~10 MB after normal use (SW caches respect the `ExpirationPlugin` limits in `vite.config.ts`).

## 7. Update / rollback

- [ ] Push a new web build → within an hour, open the TWA → **"Update available"** toast → Reload → new build active.
- [ ] Bad web build: push another web build; the toast fires again on next check. No Play action needed.
- [ ] Bad `.aab` already rolling out: **Halt rollout** in Play Console AND push the previous web build.

## 8. Regression sweep before "Send for review"

- [ ] Re-run steps 1–7 on at least one small phone (≤ 6") and one large phone (≥ 6.5").
- [ ] Re-run steps 1, 2, 3 on a 10" tablet.
- [ ] Take fresh phone + tablet screenshots for the store listing (`public/screenshots/`).
- [ ] All items in `docs/play-console-readiness.md` §1–4 checked.

Only then upload the `.aab` and start the staged rollout (20 → 50 → 100 %).
