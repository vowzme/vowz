# Closing the gaps vs The Knot & Joy

Seven additions. Every guest-facing one is a section you switch on or off — nothing appears on a couple's site unless they enable it.

## 1. Seating chart (optional module)
A visual table planner in the dashboard: create tables (round/long/sweetheart) with seat counts, drag guests from the guest list onto seats, mark unseated guests. Exports to PDF/CSV for the venue. Optional "Find my seat" lookup on the wedding site, where a guest types their name and sees their table.

## 2. Wedding party profiles (optional site section)
A new "Wedding party" section next to the couple bios: photo, name, role (maid of honour, best man, brother, cousin), a one-line note, and optional social link. Grouped into Bride's side / Groom's side / Family. Fully editable, drag to reorder, mobile-first cards.

## 3. Hotel blocks with rates and booking (upgrade to existing travel text)
Hotels become structured entries: photo, name, distance from venue, star rating, nightly rate with currency, room-block code, block expiry date, and a "Book now" link (hotel site or booking link the couple pastes). Guests see rate cards instead of a paragraph. Couples can still write free text alongside.

## 4. Guest groups and tags (fixes broadcasts)
Guests get groups (Bride's side, Groom's side, Friends, Colleagues, Family) and free tags (Sangeet only, Out-of-town, Kids). Group/tag filters apply across the guest list, the broadcast panel (WhatsApp/SMS/email now target a filtered set), invite sending, and reminders. Per-event invitees become a saved tag so "Sangeet only" is one click.

## 5. Live photo wall (optional, for the venue screen)
A full-screen display mode at a dedicated link: approved guest album photos animate in as they arrive, with a QR code and the upload link on screen so guests keep contributing. Auto-refreshing, no controls, designed for a projector or TV. Moderation still governs what appears.

## 6. Save-the-Date as a product
A low-price early-entry offer, separate from the full plan: a Save-the-Date mini page (couple names, date, city, one photo, "details to follow") plus matching cards, a shareable link and guest list capture. Priced below the full plan, and its amount is credited when the couple later upgrades. New pricing card, FAQ entry and landing section.

## 7. Vendor marketplace
Two sides:
- **For vendors:** sign up, pick a category (photography, printing, dress rental, decor, catering, event management, makeup, mehendi, music, venues), and build a mini brand page — cover image, logo, about, gallery, services/packages with prices, service areas, contact and WhatsApp button, working hours, social links. Live editor with preview, own public URL, and a dashboard for enquiries.
- **For couples/public:** a browsable directory with category and city filters, search, nearby-first ordering, featured placement, enquiry form, save-to-shortlist, and reviews left by verified couples. Vendor profiles are approved by admin before going live.

Admin gets a vendors screen (approve, feature, suspend, category management) and the directory pages are SEO-indexed and added to the sitemap.

## Technical notes
- New tables: `seating_tables`, `seating_assignments`, `wedding_party_members`, `hotel_blocks`, `guest_groups` + `guest_tags` (or a tags array on `guests`), `vendors`, `vendor_services`, `vendor_media`, `vendor_enquiries`, `vendor_reviews`, `save_the_date_orders`. Each with GRANTs and RLS (owner-scoped; vendor rows scoped to the vendor's user id; public read only when approved/published).
- New routes: `/dashboard/seating/:siteId`, `/photo-wall/:slug`, `/vendors`, `/vendors/:category`, `/vendor/:slug`, `/vendors/signup`, `/vendor/dashboard`, `/admin/vendors`, `/save-the-date`.
- New site section types: `party`, `hotels` (structured), plus the existing travel section kept for compatibility.
- Broadcast, invite-send and reminder queries gain a group/tag filter.
- Sitemap generator extended with vendor categories and published vendor pages.

## Order of work
Guest groups and tags → wedding party → hotel blocks → seating chart → photo wall → Save-the-Date product → vendor marketplace (largest, built last in its own pass).
