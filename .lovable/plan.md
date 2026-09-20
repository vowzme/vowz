# Make all 100 wedding templates visually distinct

## Goal
Give every wedding website template its own premium, mobile-friendly visual identity while preserving existing published customer sites.

## Changes
- Expand the template design system from 10 repeated layouts to 100 deterministic design recipes.
- Build each recipe from a unique combination of composition, image treatment, typography hierarchy, framing, ornaments, spacing, and content placement.
- Keep the existing template data and URLs unchanged; only catalogue cards and demo previews receive the new presentation.
- Make the full preview use the same recipe shown on its template card.
- Update the templates page count and style labels from the live catalogue.
- Ensure cards and previews fit phone, tablet, and desktop screens with readable text and touch-friendly controls.

## Technical details
- Replace the name-to-10-layout mapping with a stable 100-recipe registry, so each current template always resolves to one unique recipe.
- Reuse a controlled set of responsive structural primitives, but vary their parameters enough that no two catalogue entries share the same complete visual recipe.
- Do not rewrite saved wedding-site section data or modify existing customer themes.
- Validate uniqueness programmatically, then check the catalogue and full preview at mobile and desktop sizes.

## Verification
- Confirm 100 templates resolve to 100 unique recipe IDs.
- Confirm the templates page reports the correct count.
- Check a representative sample across all layout families on 390px mobile and desktop.
- Confirm TypeScript and the live preview build remain clean.
