# Premium template polish, a friendlier editor, and removing the install/splash layer

## 1. Make all 100 website designs feel premium

- Deepen the visual layer behind every design: richer layered backgrounds, foil-style accents, refined frames, softer depth, and finer type rhythm — each of the 100 recipes keeps its own identity.
- Upgrade the actual site pages too, not just the preview tiles: hero, story, gallery, schedule, and closing areas get the same premium treatment.
- Keep everything light: decoration stays pure CSS, photos load only when scrolled to, so phones stay fast.
- Check a sample of designs on phone, tablet, and desktop for readability and no sideways scrolling.

## 2. Editing that works properly on a phone

- Rebuild the editor's section list so a section can be moved by long-press-and-drag on a phone and by dragging on a computer, with up/down buttons as a reliable fallback.
- Add a clear "Add section" sheet showing every available section with a short description, so couples can build a page in any order instead of a fixed one.
- Mobile editing layout: the page preview on top, controls in a scrollable sheet beneath, large tap targets, and a visible Save state.
- Allow duplicating, renaming, hiding, and deleting a section from one menu.

## 3. Remove the app-install and splash layer

- Remove the "install this app" prompts (including the iPhone hint banner), the background updater, the app manifest and icons wiring, the offline page, and the install diagnostics page.
- Remove the opening splash screen so the site loads straight into the page.
- Leave the favicon, social preview images, and normal site behaviour untouched.

## 4. Native mobile app groundwork

- Record the direction for a real mobile app (store listing, native shell, shared login and data) in the roadmap as the next major track, with the decisions needed before building.

## Technical details

- Extend `src/lib/template-layouts.tsx` with a richer ornament/texture layer per recipe, keeping the existing 100 stable recipe IDs so saved sites don't change.
- Apply matching premium treatment in `src/pages/PublicSite.tsx` section renderers and `src/components/HeroSection.tsx` layouts.
- Replace the current reorder code in `src/pages/Editor.tsx` with pointer-based drag plus move buttons; add a section picker sheet driven by the existing section type registry.
- Delete `src/pwa/`, `src/lib/pwa-analytics.ts`, `src/components/IosInstallPrompt.tsx`, `src/pages/PwaDiagnostics.tsx`, `public/offline.html`, `public/manifest.webmanifest`, the splash assets and generator, the PWA Vite plugin, and their references in `index.html`, `src/main.tsx`, `src/App.tsx`, and the validation scripts.

## Verification

- Typecheck and build stay clean.
- Templates page and a full site preview checked at 390px and desktop.
- Editor drag, add, and delete exercised on a 390px viewport.
- Confirm no service worker, manifest, or splash markup remains in the built output.
