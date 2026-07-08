# End-to-End Tests

Playwright smoke suite covering public flows and gating behavior.

## What's covered

- **Public routes render** — `/`, `/pricing`, `/templates`, `/card-gallery`, `/blog`, `/about`, `/contact`
- **Auth page** — signup/login toggle, form validation
- **Route protection** — unauthenticated `/dashboard`, `/wizard`, `/editor` redirect to `/auth`
- **Admin gating** — `/debug/icons` and `/admin/*` redirect for non-admins
- **Premium template gating (UI)** — locked-badge visible on premium cards for anonymous visitors
- **SEO basics** — sitemap.xml + robots.txt reachable, `<title>` non-default

## What's NOT covered yet (needs decisions)

These require real credentials or fixtures — tell me which you want and I'll wire them:

1. **Full onboarding wizard → publish** — needs a disposable test user auto-provisioned + cleaned up. Options:
   - Create a dedicated `e2e-test@vowz.me` user via service-role at test start, wipe at end.
   - Use Supabase's `admin.createUser` inside a `globalSetup`.
2. **Payment gating end-to-end** — needs Razorpay **test-mode** keys and a mocked webhook. The current setup uses live keys; running real payment tests against live would charge cards.
3. **Custom domain wizard** — requires DNS mocking (can't verify real domain in CI).

## Run locally

```
bun add -D @playwright/test
bunx playwright install chromium
bunx playwright test
```

Dev server must be running on `http://localhost:8080` (Vite's default in this project).