# LUXE: finish the tier end to end

## What I checked first (gaps found)

- The app currently builds fine. The `use-mobile.tsx` error message you keep seeing is a stale cached artifact, not a real problem.
- Themes page: LUXE designs are hidden from the normal grid and locked for non-payers, but the dedicated LUXE showcase section was never added — so right now the three LUXE designs are invisible to everyone.
- Card sharing: the database already stores a share link and a switch for each card, but there is no page that opens a shared card, and nothing in the editor turns sharing on or copies the link. So the guest link does not work yet.
- No LUXE area for couples, and no LUXE screen in the admin panel.
- Home page has no LUXE section.
- LUXE unlock payment (₹499 / $10) already works through both India and international checkout, and access is already enforced in the database.

## What I will build

### 1. Themes page — LUXE showcase
A separate gold-badged "LUXE Collection" band above the normal categories, with live previews of all three LUXE designs. Preview is open to everyone; "Use this design" only works after unlocking, otherwise it offers the unlock.

### 2. Home page — LUXE section
Placed directly under the website themes section: six LUXE cards (three websites + three reveal cards), the add-on price shown clearly as "on top of your plan", and a "View all LUXE templates" button to the themes page.

### 3. Shareable guest card link
- New public page at `/card/:token` that loads the card by its share link and plays the opening reveal for guests, then shows the invitation and an RSVP button.
- In the card editor: a Share panel to switch sharing on/off, copy the link, and send it on WhatsApp.

### 4. LUXE couple area (`/dashboard/luxe`)
One place showing unlock status and purchase date, the LUXE website designs with "apply to my site", the LUXE reveal cards, and every shared guest link with copy/WhatsApp/disable controls. Non-payers see a locked version with the unlock button.

### 5. Admin LUXE screen (`/admin/luxe`)
List of every LUXE couple: email, amount paid, payment method, date, status, their LUXE sites and cards. I can grant LUXE manually (comped access), revoke it, and see total LUXE revenue. Added to the admin sidebar.

### 6. Real unlock walkthrough
I will grant your own account LUXE (as you asked, instead of a real payment), then walk it through: apply a LUXE theme, open a LUXE card, play the reveal, turn on sharing and open the guest link in a browser — and report what I see at each step.

## Technical notes

- New: `src/pages/SharedCard.tsx`, `src/pages/LuxeDashboard.tsx`, `src/pages/admin/AdminLuxe.tsx`, `src/components/LuxeCollectionSection.tsx`; routes in `src/App.tsx`.
- Shared card reads through the existing `get_shared_card(token)` function — no new public table access.
- Admin grant/revoke needs a small migration: admin-only insert/update policies on `user_luxe_unlocks` (currently no write policy exists), with `provider = 'admin_grant'`.
- Reuses `useLuxeAccess`, `CardReveal`, `BuyLuxeButton`, and the existing theme demo previews.

## Not included

- Charging a separate subscription for LUXE websites — LUXE stays one one-time unlock covering both the reveal cards and the LUXE website designs, as agreed earlier. Say the word if you want it split into its own recurring charge instead.
