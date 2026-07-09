// Structured help content used by <HelpTip /> (inline "?" popovers) and
// <DashboardTour /> (spotlight walkthrough). Editing these strings changes
// copy across the whole dashboard in one place.

export interface HelpEntry {
  title: string;
  /** One-line summary. */
  what: string;
  /** Why the user should care. Optional. */
  why?: string;
  /** Concrete actions the user can take right now. */
  try?: string[];
}

export const HELP: Record<string, HelpEntry> = {
  overview: {
    title: "Overview tab",
    what: "A live snapshot of your wedding site.",
    why: "One place to edit content, publish, share the link and see RSVP counts — no digging through menus.",
    try: [
      "Click Edit to open the site editor",
      "Toggle Publish to take the site live",
      "Copy the public link or download the QR code",
    ],
  },
  publish: {
    title: "Publish / Unpublish",
    what: "Controls whether guests can visit your site.",
    why: "Draft mode lets you polish privately. Publishing makes it live at /site/your-slug instantly.",
    try: [
      "Toggle Publish when you're ready to share",
      "Unpublish anytime to hide it again",
      "Use Pause if you want to keep the URL but show a temporary message",
    ],
  },
  slug: {
    title: "Custom URL",
    what: "The last part of your public link (e.g. /site/rahul-sona-2026).",
    why: "A short, memorable slug is easier to share verbally, print on invites, and remember.",
    try: [
      "Use names + year, no spaces (e.g. anu-vikram-2026)",
      "Old links keep working — we auto-redirect them",
    ],
  },
  qr: {
    title: "QR code",
    what: "A downloadable QR code that opens your site when scanned.",
    why: "Perfect for printed invites, save-the-date cards, thank-you notes and table cards.",
    try: [
      "Download the PNG and drop it into your invite design",
      "Test it with your phone camera before printing",
    ],
  },
  guide: {
    title: "Guide tab",
    what: "A checklist of tasks to launch your site.",
    why: "Ticks update automatically as you complete each step, so you always know what's next.",
    try: [
      "Follow the tasks top-to-bottom",
      "Skip optional ones — only the essentials block publishing",
    ],
  },
  budget: {
    title: "Budget tab",
    what: "Track your total wedding budget and expenses.",
    why: "See at a glance how much you've spent per category and how much is left.",
    try: [
      "Set a total budget first",
      "Log expenses under Venue, Catering, Outfits, etc.",
      "Attach receipts by pasting a note or link",
    ],
  },
  checklist: {
    title: "Checklist tab",
    what: "A 6-month wedding planning task list, pre-seeded for you.",
    why: "Nothing falls through the cracks — reminders keep you on schedule.",
    try: [
      "Add your own tasks alongside the defaults",
      "Set a due date to get email reminders",
    ],
  },
  analytics: {
    title: "Analytics tab",
    what: "Aggregated stats about who's visited your site.",
    why: "See how many guests opened the invite and which sections they read — helpful before the big day.",
    try: [
      "Check visits after sending the link out",
      "Look at referrers to see if WhatsApp / Instagram links worked",
    ],
  },
  rsvps: {
    title: "Guest list tab",
    what: "Every guest RSVP, live as it comes in.",
    why: "Numbers you can trust for the caterer and seating chart.",
    try: [
      "Filter by attending / declined",
      "Export to CSV for your planner",
      "Reply directly if a guest left a message",
    ],
  },
  blessings: {
    title: "Blessings wall",
    what: "Messages and photos guests leave for you.",
    why: "A digital wedding album that grows on its own — a keepsake beyond the day itself.",
    try: [
      "Approve blessings to show them publicly",
      "Hide anything that shouldn't appear",
      "Download all messages after the wedding",
    ],
  },
  billing: {
    title: "Billing tab",
    what: "Your subscription status, invoices and upgrades.",
    why: "Manage Premium, download GST invoices, and renew from one place.",
    try: [
      "Download PDF invoices for your records",
      "Upgrade to Premium for more storage & advanced features",
    ],
  },
  settings: {
    title: "Settings tab",
    what: "Site-wide preferences and advanced options.",
    why: "Change your slug, set a password, and manage family collaborators.",
    try: [
      "Set a password to keep the site private",
      "Invite family with read-only or edit access",
    ],
  },
  music: {
    title: "Background music",
    what: "The soundtrack guests hear when your site opens.",
    why: "The right song sets the emotional tone before they read a word.",
    try: [
      "Pick from curated Romantic, Cinematic or Cultural tracks",
      "Upload your own MP3 (up to 15 MB)",
      "Toggle off from Overview if you'd rather have silence",
    ],
  },
  storage: {
    title: "Storage",
    what: "Space for photos, videos and audio you upload.",
    why: "Free plan gets 100 MB; Premium unlocks 500 MB. Add-on packs available.",
    try: [
      "Compress large photos before uploading",
      "Delete unused uploads from Media Manager",
    ],
  },
  domain: {
    title: "Custom domain",
    what: "Use your own domain like rahulandsona.com (Premium).",
    why: "A personal domain looks polished on printed invites and never expires with the platform.",
    try: [
      "Buy a domain from any registrar",
      "Follow the DNS wizard — we verify automatically",
    ],
  },
};

export interface TourStep {
  selector: string;
  title: string;
  html: string;
  /** Optional tab to switch to before this step runs. */
  tab?: string;
}

/** Turn a HelpEntry into the rich HTML used inside the driver.js popover. */
function popoverHtml(intro: string, entry?: HelpEntry): string {
  const parts: string[] = [`<p style="margin:0 0 8px 0">${intro}</p>`];
  if (entry?.what) {
    parts.push(`<p style="margin:0 0 4px 0"><strong>What this does</strong><br/>${entry.what}</p>`);
  }
  if (entry?.why) {
    parts.push(`<p style="margin:0 0 4px 0"><strong>Why it matters</strong><br/>${entry.why}</p>`);
  }
  if (entry?.try?.length) {
    parts.push(
      `<p style="margin:6px 0 4px 0"><strong>Try this</strong></p><ul style="margin:0;padding-left:18px">${entry.try
        .map((t) => `<li style="margin-bottom:2px">${t}</li>`)
        .join("")}</ul>`,
    );
  }
  return parts.join("");
}

export const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="welcome"]',
    title: "Welcome to your dashboard 💍",
    html: `<p style="margin:0 0 6px 0">This is command central for your wedding site.</p><p style="margin:0">We'll walk through each tab in about 60 seconds so you know exactly what everything does.</p>`,
  },
  {
    selector: '[data-tour="site-card"]',
    title: "Your site card",
    html: popoverHtml("Everything about your live site lives here.", HELP.overview),
    tab: "overview",
  },
  {
    selector: '[data-tour="publish"]',
    title: "Publish control",
    html: popoverHtml("This is the switch between draft and live.", HELP.publish),
    tab: "overview",
  },
  {
    selector: '[data-tour="music"]',
    title: "🎵 Background music",
    html: popoverHtml("Set the soundtrack for your site.", HELP.music),
    tab: "overview",
  },
  {
    selector: '[data-tour="tab-guide"]',
    title: "Guide",
    html: popoverHtml("Your launch checklist.", HELP.guide),
  },
  {
    selector: '[data-tour="tab-budget"]',
    title: "Budget",
    html: popoverHtml("Money in, money out.", HELP.budget),
  },
  {
    selector: '[data-tour="tab-checklist"]',
    title: "Checklist",
    html: popoverHtml("Planning tasks with reminders.", HELP.checklist),
  },
  {
    selector: '[data-tour="tab-analytics"]',
    title: "Analytics",
    html: popoverHtml("See who visited and what they read.", HELP.analytics),
  },
  {
    selector: '[data-tour="tab-rsvps"]',
    title: "Guest list",
    html: popoverHtml("Live RSVPs from your guests.", HELP.rsvps),
  },
  {
    selector: '[data-tour="tab-blessings"]',
    title: "Blessings",
    html: popoverHtml("Messages guests leave for you.", HELP.blessings),
  },
  {
    selector: '[data-tour="tab-billing"]',
    title: "Billing",
    html: popoverHtml("Subscriptions and invoices.", HELP.billing),
  },
  {
    selector: '[data-tour="tab-settings"]',
    title: "Settings",
    html: popoverHtml("Slug, domain, password, family access.", HELP.settings),
  },
  {
    selector: '[data-tour="tour-trigger"]',
    title: "Re-open this tour anytime",
    html: `<p style="margin:0 0 6px 0">Click <strong>Take a tour</strong> in the header whenever you want a refresher.</p><p style="margin:0">Look for the <strong>?</strong> icons next to each section for quick tips too.</p><p style="margin:8px 0 0 0">Happy planning! 💖</p>`,
  },
];