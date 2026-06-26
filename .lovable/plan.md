## Goal
Expand the invitation card system to cover the full wedding journey across religions, with at least 10 premium-quality cards per occasion, full editing, and a QR code slot (platform-generated link to the couple's wedding site OR custom upload).

## Scope

### 1. Occasion taxonomy (new dimension alongside religion)
Add an `occasion` field to template metadata:
- `save_the_date`
- `betrothal` (Roka / Nichayam / Mangni)
- `engagement` (Ring ceremony)
- `mehendi_haldi` (Hindu/Sikh pre-wedding)
- `sangeet` (Hindu/Sikh musical night)
- `nikah` (Muslim wedding)
- `wedding` (main ceremony — all religions)
- `reception`
- `anniversary`

Religion buckets stay as today: `hindu_sikh`, `christian_muslim`, `modern_minimal`, `royal_traditional`.

Target: ≥10 templates per occasion (≈90 total), distributed across religion categories so each (religion, occasion) pair has at least 2–3 designs where culturally relevant.

### 2. Template generation strategy
Rather than hand-authoring 90 unique components, extend `src/lib/card-templates.tsx`:
- Define a `OccasionPreset` (palette + decorative motif set + headline copy + ornament SVG bundle) per (occasion × style).
- Keep a single parameterised `InvitationCardArtwork` renderer (already exists) but drive borders/medallions/copy from the preset.
- Generate the catalog programmatically: `for each occasion × stylePreset (≥3 per occasion) × variant (3–4 color/typography combos)` → ≥10 cards per occasion. All entries get `is_premium: true` (premium-standard), with one free sampler per occasion.

### 3. QR code on the card
Add a `qrSlot` to `CardData`:
```ts
qr?: {
  mode: "platform" | "custom" | "none";
  url?: string;        // for platform mode: couple's wedding site URL
  imageDataUrl?: string; // for custom upload
  label?: string;      // e.g. "Scan for our website"
  position: "bottom-right" | "bottom-left" | "bottom-center";
  size: number;        // 60–160 px
};
```
- Use `qrcode` npm package (already used in `QRCodeGenerator.tsx`) to render platform QR client-side from the site URL.
- Custom upload: file → dataURL, validated PNG/JPG ≤ 1 MB.
- Renders inside `InvitationCardArtwork`; included in both PNG (html2canvas) and PDF (template-pdf-export) outputs.

### 4. Editor UX
In `CardTemplatesPreview` and `InvitationCard` editor:
- Add an **Occasion** filter row beside the existing Theme/Format chips.
- Detail view: new "QR Code" tab — toggle mode, pick position/size, upload image, optional label, live preview.
- All existing text fields stay editable (partners, date, venue, message).

### 5. Homepage / discovery
- Update `TemplatesSection` to expose occasion sub-tabs ("Save the Date", "Engagement", "Wedding", "Reception"…) that deep-link to `/card-templates-preview?occasion=...`.
- Update `CardGallery` filters to include occasion.

### 6. Data + admin
- Migration: `ALTER TABLE public.card_templates ADD COLUMN occasion text NOT NULL DEFAULT 'wedding';` + index. Seed via upsert from `FALLBACK_TEMPLATES`.
- `AdminCardTemplates` shows occasion badge + filter.
- `invitation_card_variants.data` already JSONB — stores the new `qr` block without schema change.

### 7. Analytics
Extend `trackTemplateEvent` meta with `occasion` for open/preview/use/share so `AdminCardAnalytics` can break down by occasion.

## Technical details

Files to add/modify:
- `src/lib/card-templates.tsx` — add `Occasion` type, `OCCASION_LABELS`, preset builder, expanded `FALLBACK_TEMPLATES` (≥90), QR rendering inside `InvitationCardArtwork`.
- `src/lib/card-qr.ts` (new) — helper to generate QR dataURL via `qrcode` and validate uploads.
- `src/pages/CardTemplatesPreview.tsx` — occasion filter chips, deep-link `?occasion=`, QR controls in detail panel, pass QR into exports.
- `src/pages/InvitationCard.tsx` — QR tab in editor.
- `src/components/TemplatesSection.tsx` — occasion sub-section chips.
- `src/pages/CardGallery.tsx` — occasion filter.
- `src/pages/admin/AdminCardTemplates.tsx` — occasion column + filter.
- `supabase/migrations/*` — add `occasion` column, GRANTs unchanged, backfill.
- `src/lib/template-pdf-export.ts` — ensure QR renders (it already snapshots the artwork DOM, so no change beyond confirming).

No new npm deps required (`qrcode` already in use).

## Out of scope (will not change)
- Existing card slugs and saved user variants — preserved.
- Premium gating logic (`enforce_premium_card_template` trigger) — unchanged; new cards mostly premium.
- Pricing / subscription tiers.

## Acceptance
- `/card-templates-preview` shows Occasion filter with ≥10 cards per occasion.
- Each card has a QR tab: platform mode (auto-fills couple's site URL), custom mode (upload), none.
- QR appears in live preview, PNG download, and PDF export at the chosen position/size.
- Homepage Templates section has occasion sub-tabs that deep-link correctly.
- Admin can filter templates by occasion.
