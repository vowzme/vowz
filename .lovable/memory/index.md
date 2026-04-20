# Project Memory

## Core
- Deep Navy #001F3F, Soft Gold #D4AF37, Ivory #F5F5DC. Playfair Display headings, Inter body.
- All user media stored on Cloudflare R2 via `useMediaUpload` → `r2-upload` edge function. Google Drive integration fully removed.
- `auto_confirm_email` enabled; unverified users can still access core features.
- 7-day trial enforced by account creation date. Full feature access during trial.
- Admin secured by `admin_emails` whitelist (anoojxavier008@gmail.com).

## Memories
- [Stack Architecture](mem://technical/stack-architecture) — AI tools via Lovable AI gateway (Google Gemini) edge functions
- [Domain Management](mem://features/domain-management) — Custom domain wizard, A/CNAME records, DoH verification
- [Family Collaboration](mem://features/family-collaboration) — Read-only links vs full editing permissions
- [Visual Assets](mem://brand/visual-assets) — Hero overlay, feature icons, logo usage
- [Admin Control Panel](mem://admin/control-panel) — Dashboard widgets, CSV exports, user/site management
- [Payment Integration](mem://technical/payment-integration) — Razorpay integration, dynamic discounts, edge functions
- [Enforcement Limitations](mem://technical/enforcement-limitations) — Missing storage limits and granular template tier access
- [Brand Identity](mem://brand/identity) — Logo inversion, favicon, core aesthetic
- [User Authentication](mem://features/user-authentication) — Hybrid auth flow, magic links
- [Email Communications](mem://technical/email-communications) — notify.vowz.me, process-email-queue edge function
- [Data Architecture](mem://technical/data-architecture) — Section schema, legacy flat-format compatibility
- [Security Access](mem://technical/security-access) — RLS on wedding_sites based on is_published
- [Location Mapping](mem://features/location-mapping) — Address + Maps link, auto-generated fallback URL
- [Pricing Logic](mem://technical/pricing-logic) — IP-based currency detection, manual localStorage override
- [International Site Tools](mem://features/international-site-tools) — Multi-language t(), timezone, currency conversion
- [Coupon Management](mem://business/coupon-management) — Alphanumeric codes, limits, regional scoping
- [Custom URL Slugs](mem://features/custom-url-slugs) — Unique slugs, auto-suggestions, slug_redirects
- [Watermarking Branding](mem://features/watermarking-branding) — Powered by vowz.me footer badge with dynamic color
- [Site Lifecycle Management](mem://features/site-lifecycle-management) — Pause, Reactivate, Delete states and behaviors
- [Image Processing](mem://technical/image-processing) — Canvas API compression (max 2048px, 0.82 quality, WebP/JPEG)
- [Pricing Structure](mem://business/pricing-structure) — 7-day trial, regional pricing (INR/USD)
- [Affiliate System](mem://business/affiliate-system) — 25% commission, 15% discount, UPI/GPay/PayPal
- [Onboarding Wizard](mem://features/onboarding-wizard) — 5-step manual flow (no Storage step), sessionStorage draft persistence
- [Admin Operations](mem://technical/admin-operations) — admin-delete-user edge function with service role
- [Storage Architecture](mem://technical/storage-architecture) — Cloudflare R2 sole media backend, Drive removed
- [Franchise System](mem://business/franchise-system) — 25% commission + 5% override, 48h settlement
- [Social Sharing Previews](mem://features/social-sharing-previews) — og-meta edge function proxy for crawlers
- [Google Auth Redirect](mem://technical/google-auth-redirect) — HMAC-SHA256 state parameter for OAuth redirect
