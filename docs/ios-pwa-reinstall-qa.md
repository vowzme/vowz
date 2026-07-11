# iOS PWA — Uninstall / Reinstall Verification

iOS caches `apple-touch-icon` and `apple-touch-startup-image` per origin and
freezes them at install time. A plain reinstall reuses the cached versions,
so after any icon/splash change you must clear Safari's website data **before**
adding the app back to the Home Screen. Follow this checklist end-to-end on
each device family after every icon or splash change.

## Device matrix

Test one device per row.

| Device                | apple-touch-icon | splash size |
| --------------------- | ---------------- | ----------- |
| iPhone SE / 8         | 180×180          | 750×1334    |
| iPhone 12–14 / 15     | 180×180          | 1170×2532   |
| iPhone 15/16 Pro Max  | 180×180          | 1290×2796   |
| iPad (10.2 / 10.9)    | 167×167          | 1620×2160+  |
| iPad Pro 12.9         | 167×167          | 2048×2732   |

## Step 1 — Uninstall the existing PWA

1. Long-press the **Vowz** icon on the Home Screen.
2. Tap **Remove App** → **Delete from Home Screen**.
3. Confirm the icon is gone from every Home Screen page and the App Library.

## Step 2 — Clear Safari website data for vowz.me

Do **not** skip this step — reinstalling without clearing data keeps the
cached (old) icon and splash.

Preferred (per-site, keeps other cookies):
1. Open **Safari**, go to `https://vowz.me`.
2. Tap the **Aa** (page settings) button in the address bar.
3. Tap **Website Settings** → scroll down → **Clear Website Data**.
4. Confirm.

Fallback (full Safari data reset, if the Aa menu is unavailable):
1. **Settings** app → **Safari** → **Advanced** → **Website Data**.
2. Search for `vowz`.
3. Swipe left on the entry → **Delete**.

Then fully close Safari: swipe up from the bottom to the App Switcher and
flick the Safari card away.

## Step 3 — Reinstall to the Home Screen

1. Reopen **Safari** → visit `https://vowz.me`.
2. Wait for the page to fully load so Safari refetches the manifest and
   icon links.
3. Tap the **Share** button → **Add to Home Screen** → **Add**.

## Step 4 — Verify install appearance

1. Close Safari (App Switcher → flick Safari away).
2. Tap the new **Vowz** Home Screen icon.

Expected on iPhone and iPad:

- **Home Screen icon**: full logo visible, glossy white background covers
  the entire rounded-square tile — no navy corners, no black halo.
- **Splash screen**: glossy white background for ~1 s with the logo
  centered, then the app.
- **Status bar**: dark content on the white splash (matches
  `apple-mobile-web-app-status-bar-style="default"`).
- **Standalone chrome**: no Safari URL bar, no tab bar.

## Step 5 — Cross-check with the diagnostics page

Open `https://vowz.me/debug/pwa` (admin login required). Every row under
**Icons & splash** must show a green `OK` in the **Verdict** column. Any
`FAIL` means the deployed PNG is transparent or too dark — do not ship.

## If the old icon or splash still appears

1. Confirm you cleared website data in Step 2 (not just deleted the app).
2. Reboot the device — iOS holds a per-origin apple-touch-icon cache in
   Springboard that survives Safari data clears on some builds.
3. Reinstall from Step 1. The build-time cache-bust (`?v=<build id>`
   emitted by the `iconCacheBust` Vite plugin) forces Safari to refetch,
   but the OS-level Springboard cache needs the reboot.
4. Re-run `bun run validate:white-glossy` locally — a `FAIL` there means
   the asset itself is wrong and no reinstall will help.

## Related

- `docs/pwa-icon-qa.md` — Android launcher mask QA
- `scripts/validate-white-glossy.ts` — CI-blocking opacity/palette check
- `src/pages/PwaDiagnostics.tsx` — live per-icon verdict at `/debug/pwa`