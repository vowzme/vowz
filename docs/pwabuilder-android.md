# Ship Vowz to Google Play with PWABuilder

PWABuilder wraps our PWA in a Trusted Web Activity (TWA) Android package.
This guide is the exact sequence to produce a Play-Store-ready `.aab`.

## 0. Prereqs (already in the repo)

- ✅ `public/manifest.webmanifest` — name, short_name, description, icons
  (192 + 512, `any` and `maskable`), start_url, scope, display, id,
  screenshots (narrow + wide), theme/background color, categories,
  shortcuts, `prefer_related_applications: false`.
- ✅ Service worker at `/sw.js` — emitted by `vite-plugin-pwa` at build
  time. Registered from `src/pwa/register.ts` only in production
  (never in Lovable preview/dev/iframes).
- ✅ HTTPS on `vowz.me` (Lovable custom domain).
- ✅ Icons white glossy — validated by `bun run validate:white-glossy`.
- ⚠ `public/.well-known/assetlinks.json` — placeholder present; must be
  filled after PWABuilder generates the signing key (Step 4).
- ⚠ `public/screenshots/` — add three JPGs (see Step 1).

## 1. Add screenshots (Play Store rich install UI)

Take three JPGs and place them under `public/screenshots/`:

| File                          | Size (px)    | form_factor |
| ----------------------------- | ------------ | ----------- |
| `mobile-home.jpg`             | 1080 × 1920  | narrow      |
| `mobile-editor.jpg`           | 1080 × 1920  | narrow      |
| `desktop-home.jpg`            | 1920 × 1080  | wide        |

They are already referenced from `manifest.webmanifest`. Play Store
shows them on the install dialog.

## 2. Generate the Android package on PWABuilder

1. Open https://www.pwabuilder.com and enter `https://vowz.me`.
2. Wait for the score card. Manifest / SW / Security should all be
   green. If SW is missing, run `bun run build && bun run preview` and
   test the live URL — the SW is production-only.
3. Click **Package for Stores → Android**.
4. Use these values:
   - Package ID: `me.vowz.twa`
   - App name: `Vowz`
   - Launcher name: `Vowz`
   - Display mode: `standalone`
   - Status bar color: `#FFFFFF`
   - Splash screen color: `#FFFFFF`
   - Icon URL: leave as detected `/icons/icon-512.png`
   - Maskable icon URL: `/icons/icon-maskable-512.png`
   - Monochrome icon URL: `/icons/adaptive-icon-foreground.svg`
   - Signing key: **Generate a new key** (PWABuilder holds it, or
     download the `.keystore` and back it up — you MUST reuse the same
     key for every future update to Play).
5. Download the ZIP. It contains `app-release-bundle.aab`,
   `signing-key-info.txt`, and `assetlinks.json`.

## 3. Verify with Digital Asset Links

Open `signing-key-info.txt` and copy the `SHA-256 fingerprint` value.
Edit `public/.well-known/assetlinks.json` and replace:

- `REPLACE_WITH_YOUR_PACKAGE_NAME` → `me.vowz.twa` (matches Step 2)
- `REPLACE_WITH_YOUR_SHA256_FINGERPRINT` → the SHA-256 from the file

Publish the site (frontend change → click **Update** in the publish
dialog). Confirm the file is live:

```
curl https://vowz.me/.well-known/assetlinks.json
```

Without a matching fingerprint the TWA will show a browser URL bar
instead of full-screen chrome — the Play submission is still allowed
but the app looks like a webview.

## 4. Submit to Google Play

1. Google Play Console → **Create app**.
2. App details:
   - Category: Lifestyle
   - Contact email: `hello@vowz.me`
   - Privacy policy URL: `https://vowz.me/privacy-policy`
3. **Content rating** questionnaire (Vowz is a wedding-planning
   utility, no user-generated hate/violence — expect *Everyone*).
4. **Data safety**: declare email + payment data collected, encrypted
   in transit and at rest. See our privacy policy for the full list.
5. **Target audience**: 13+.
6. **Ads**: none.
7. **App content → Government apps**: no.
8. Upload the `.aab` from PWABuilder to **Production → Create new
   release**. Fill release notes.
9. Store listing:
   - Short description (≤80 chars): "Beautiful wedding websites &
     digital invitations — free to start."
   - Full description: reuse the copy from `public/llms.txt`.
   - Feature graphic: 1024×500 PNG/JPG.
   - Phone screenshots (min 2, 320–3840 px): reuse the mobile shots
     from Step 1.
10. Roll out for review. First review usually takes 1–7 days.

## 5. Shipping updates

- Content changes → just publish from Lovable, TWA fetches the live
  site (no Play resubmission needed).
- Manifest / icon / start_url changes → produce a new `.aab` from
  PWABuilder using the **same signing key**, bump `versionCode`, and
  upload as a new Production release.

## Related

- `docs/pwa-icon-qa.md` — Android launcher mask QA
- `docs/ios-pwa-reinstall-qa.md` — iOS Safari install verification
- `scripts/validate-white-glossy.ts` — CI opacity/palette check
- `/debug/pwa` — live icon + manifest verdict (admin-only)