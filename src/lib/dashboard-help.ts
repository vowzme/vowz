// Content for HelpTip components across the dashboard. Editing these
// strings is enough to change the copy shown next to each section.
export const HELP: Record<string, { title: string; body: string }> = {
  overview: {
    title: "Overview",
    body: "Quick snapshot of your site — edit, publish/unpublish, copy the public link, download an invitation card, and see RSVP counts at a glance.",
  },
  publish: {
    title: "Publishing",
    body: "Publish makes your site live at /site/your-slug. Unpublish hides it instantly. Pause keeps the URL but shows a friendly 'temporarily paused' message.",
  },
  slug: {
    title: "Custom URL",
    body: "Change the last part of your public link. Choose something easy to remember like 'rahul-sona-2026'. The old link keeps working — we auto-redirect it.",
  },
  qr: {
    title: "QR code",
    body: "Download a branded QR code to print on paper invites, thank-you notes or table cards. Scanning opens your wedding site directly.",
  },
  guide: {
    title: "Getting started guide",
    body: "Step-by-step tasks to launch your site — from adding photos and events to publishing. Ticks update automatically as you complete each step.",
  },
  budget: {
    title: "Budget tracker",
    body: "Set a total wedding budget, log expenses by category (venue, catering, outfits…), and see remaining balance and category-wise breakdowns.",
  },
  checklist: {
    title: "Wedding checklist",
    body: "Pre-seeded task list covering 6 months of planning. Add your own tasks, set reminders, and tick items off as you go.",
  },
  analytics: {
    title: "Site analytics",
    body: "See how many visitors opened your site, which sections they scrolled to, and where they came from. Only aggregated stats — no personal data.",
  },
  rsvps: {
    title: "Guest list",
    body: "Every guest RSVP shows here in real time — attending / declined, guest counts, meal preference and messages. Export as CSV any time.",
  },
  blessings: {
    title: "Blessings wall",
    body: "Guests can leave heartfelt messages (with photos!) on your site. Approve, reply or hide from here — approved blessings appear publicly.",
  },
  billing: {
    title: "Billing & invoices",
    body: "Your subscription status, past payments and downloadable PDF invoices. Upgrade or renew Premium from here.",
  },
  music: {
    title: "Background music",
    body: "Set the soundtrack guests hear when they open your site. Pick from our curated romantic, cinematic and cultural tracks — or turn music off entirely.",
  },
  storage: {
    title: "Storage",
    body: "Photos and videos are stored securely on Cloudflare R2. Free plan gets 100 MB; Premium unlocks 500 MB + optional add-ons.",
  },
  domain: {
    title: "Custom domain",
    body: "Connect your own domain like 'rahulandsona.com' (Premium). We give you the exact DNS records and verify the setup automatically.",
  },
};

export const TOUR_STEPS: Array<{ selector: string; title: string; description: string }> = [
  { selector: '[data-tour="welcome"]', title: "Welcome to your dashboard 💍", description: "This is command central for your wedding site. Let's take a quick tour of what you can do here." },
  { selector: '[data-tour="site-card"]', title: "Your site card", description: "Edit content, publish/unpublish, view your live site, or download an invitation card — all from here." },
  { selector: '[data-tour="tabs"]', title: "Everything you need", description: "Guide, Budget, Checklist, Analytics, Guest list, Blessings, Billing, Settings — each tab handles one part of your wedding." },
  { selector: '[data-tour="rsvps-tab"]', title: "Guest RSVPs", description: "Real-time responses from your guests appear in the Guest List tab — including meal preferences and messages." },
  { selector: '[data-tour="music"]', title: "🎵 Background music", description: "New! Pick a soundtrack for your wedding site from our curated library. Guests will hear it when they open the invite." },
  { selector: '[data-tour="publish"]', title: "Publish when you're ready", description: "Toggle Publish to make your site live at its public URL. You can unpublish or pause it any time." },
  { selector: '[data-tour="tour-trigger"]', title: "Re-open this tour anytime", description: "Click the 'Take a tour' button in the header whenever you want a refresher. Happy planning! 💖" },
];