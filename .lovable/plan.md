# Dashboard Guide + Music Access + Features Refresh

## 1. Audit existing wedding sites
Only 3 sites exist (1 published: `rahul-sona-mr9clre9`, 2 drafts). Actions:
- Load `/site/rahul-sona-mr9clre9` via headless browser, capture screenshot, check console for errors, verify RSVP/blessings/music sections render.
- Run automated smoke test against each site's public route (200 OK, no JS errors, all sections present).
- Report findings; only fix if real bugs are found (no speculative rewrites).

## 2. Verify background music is exposed in the customer dashboard
Currently `BackgroundMusicPlayer` and `src/lib/music-library.ts` exist and the Editor uses them, but Dashboard has no direct music toggle.
- Add a compact "Background Music" card in Dashboard's Site Settings tab showing: current selection, enable/disable switch, "Change music" button linking to Editor's music section (`/editor/:id#music`).
- In the Editor, ensure the music section has `id="music"` so deep links scroll to it.
- No new tables or backend needed — reuse existing `wedding_sites.background_music` field.

## 3. Interactive spotlight tour + collapsible in-panel tips (hybrid)
- Install `driver.js` (small, ~10 KB, no deps).
- New component `src/components/DashboardTour.tsx`:
  - Steps highlight: Welcome banner → Site card → RSVP tab → Guest Blessings → Budget → Music card → Publish toggle → QR/Share → Premium.
  - Trigger: auto-open on first visit (stored in `localStorage.vowz_tour_seen`), plus a persistent "Take a tour" button in the header.
- New reusable `src/components/HelpTip.tsx`: small `?` icon that expands an inline `<Collapsible>` with 2–3 sentences of contextual help.
- Attach `<HelpTip>` next to key section headings in Dashboard (RSVPs, Blessings, Budget, Music, Publish, Custom Slug, Storage).
- Content lives in one file `src/lib/dashboard-help.ts` so copy is easy to edit.

## 4. Refresh Features section on landing page
Audit `src/components/FeaturesSection.tsx` against actual capabilities. Confirmed features to surface:
- Background music library (new)
- Custom URL slug
- Custom domain
- Family collaboration (view / edit access links)
- Guest blessings wall
- RSVP with meal preference & multi-event
- Budget & expense tracker
- Wedding checklist & reminders
- Livestream embed
- Photo/video gallery on R2
- Multi-language + timezone + currency
- Invitation card templates + PDF export
- QR code, analytics
- Blog/story sections
Update icons/copy; keep design tokens (Deep Navy / Soft Gold / Ivory, Playfair + Inter). No layout rewrite — content refresh only.

## Technical notes
- All changes stay in frontend/presentation code.
- No schema changes, no new edge functions.
- `driver.js` is added via `bun add driver.js`; tour styles imported once in `main.tsx`.
- Playwright audit script lives in `/tmp/browser/` (not committed).

## Order of execution
1. Site audit (Playwright) — read-only, informs any fixes.
2. Music card in Dashboard + Editor anchor.
3. `HelpTip` + `DashboardTour` (hybrid guide).
4. FeaturesSection refresh.
5. Report back with screenshots + summary.
