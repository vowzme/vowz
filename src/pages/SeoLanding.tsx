import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, MessageCircle, Globe, Users, CalendarHeart, MapPin, Camera, Languages, Palette, Send, type LucideIcon } from "lucide-react";

type Page = {
  path: string; title: string; description: string; h1: string; intro: string; keywords: string;
  steps: { icon: LucideIcon; title: string; body: string }[];
  sections: { h2: string; paras: string[] }[];
  checklist: string[];
  sample?: { label: string; text: string };
  faqs: { q: string; a: string }[];
  related: { to: string; label: string }[];
};

const PAGES: Record<string, Page> = {
  whatsapp: {
    path: "/whatsapp-wedding-invitation",
    title: "WhatsApp Wedding Invitation Maker — Send E-Invites with RSVP | Vowz",
    description: "Create a WhatsApp wedding invitation in minutes. Beautiful e-invite link with photos, event timings, Google Maps and one-tap RSVP. 900+ card designs, free 7-day trial.",
    h1: "WhatsApp Wedding Invitation Maker",
    keywords: "whatsapp wedding invitation, whatsapp wedding card, wedding invitation for whatsapp, e invite for wedding, digital wedding invitation, wedding invitation message whatsapp",
    intro: "Most Indian wedding invitations are now shared on WhatsApp. Vowz turns your invitation into a link that opens a full card and wedding website — with every function, venue map and an RSVP button — so family and friends can reply in one tap instead of calling.",
    steps: [
      { icon: Palette, title: "Choose a design", body: "Pick from 900+ invitation cards and 250+ wedding website themes — Hindu, Muslim, Christian, Sikh, Kerala, Bengali, modern and more." },
      { icon: CalendarHeart, title: "Add your functions", body: "Haldi, mehendi, sangeet, wedding and reception — each with its own date, time, venue and dress code." },
      { icon: Send, title: "Send on WhatsApp", body: "Tap Share and the invitation link opens WhatsApp with a ready message. Send to individuals, groups or broadcast lists." },
      { icon: Users, title: "Track RSVPs", body: "Guests reply attending or not, how many people, meal choice and which functions. You see the list live and can download it." },
    ],
    sections: [
      { h2: "Why a WhatsApp wedding invitation beats a forwarded image", paras: [
        "A JPG card gets lost in the chat and can't be changed. A Vowz link always shows the latest details — if the reception venue changes, every guest who opens it sees the new address.",
        "Guests get a Google Maps button, a countdown, your photo gallery and the full schedule, all from a single message. Elders can tap to call you, and out-of-town guests see hotel and travel notes.",
      ]},
      { h2: "Personal invitations for every guest", paras: [
        "Add your guest list and Vowz creates a private link for each family with their name on it and the number of plus-ones allowed. Group guests by side (bride's or groom's), family or friends, and send reminders only to people who haven't replied.",
      ]},
    ],
    sample: { label: "Sample WhatsApp invitation message", text: "Namaste 🙏\nWith the blessings of our families, we warmly invite you to the wedding of Priya & Arjun on 12 December 2026 in Kochi.\nView the invitation, schedule and venue map, and please RSVP here: vowz.me/site/priya-arjun\nWe look forward to celebrating with you! ❤️" },
    checklist: ["Opens instantly on any phone — no app download for guests", "Link preview with your photo and names in WhatsApp", "Separate pages for each function", "One-tap RSVP with meal and plus-one details", "Reminders to guests who haven't replied", "Works in English and Indian languages"],
    faqs: [
      { q: "How do I send a wedding invitation on WhatsApp?", a: "Create your invitation on Vowz, tap Share, and choose WhatsApp. The message and link are filled in for you — just pick the contacts or group." },
      { q: "Can guests RSVP from WhatsApp?", a: "Yes. The link opens your invitation with an RSVP button. Guests choose attending or not, number of people and meal preference, and you see replies instantly." },
      { q: "Is a WhatsApp invitation acceptable for an Indian wedding?", a: "Yes — most families now send a digital invitation on WhatsApp, often alongside a phone call or printed card for elders. A personal link with the guest's name keeps it respectful." },
      { q: "Can I send a video wedding invitation on WhatsApp?", a: "Yes. Vowz lets you add a video invitation and background music to your card and website, all shared through the same link." },
      { q: "How much does it cost?", a: "You can design and preview for free with a 7-day trial. See the pricing page for plans in INR and USD." },
    ],
    related: [{ to: "/online-wedding-card-maker", label: "Online wedding card maker" }, { to: "/indian-wedding-website", label: "Indian wedding website" }, { to: "/#wording", label: "Invitation wording ideas" }, { to: "/card-gallery", label: "Browse card designs" }],
  },
  indian: {
    path: "/indian-wedding-website",
    title: "Indian Wedding Website Maker — Themes for Every Tradition | Vowz",
    description: "Make an Indian wedding website with all your functions, love story, gallery, venue maps and WhatsApp RSVP. 250+ themes for Hindu, Muslim, Christian, Sikh, Kerala, Bengali weddings.",
    h1: "Indian Wedding Website Maker",
    keywords: "indian wedding website, wedding website india, indian wedding website template, hindu wedding website, wedding website maker, shaadi website",
    intro: "Indian weddings have many functions, many families and guests travelling from everywhere. A Vowz wedding website keeps it all in one place — every ceremony, venue, dress code, family introduction and photo — and lets guests RSVP from WhatsApp.",
    steps: [
      { icon: Palette, title: "Pick a tradition-inspired theme", body: "Royal Rajput, South Indian temple, Kerala backwaters, Bengali alpona, Punjabi Anand Karaj, Nikah, church wedding and modern styles." },
      { icon: CalendarHeart, title: "Add every function", body: "Roka, engagement, haldi, mehendi, sangeet, muhurat, pheras and reception — each with timings and maps." },
      { icon: Globe, title: "Get your own web address", body: "Share vowz.me/site/your-names or connect your own domain." },
      { icon: MessageCircle, title: "Share and collect RSVPs", body: "Send the link on WhatsApp and see who is coming to which function." },
    ],
    sections: [
      { h2: "Built for Indian wedding traditions", paras: [
        "Each theme is designed around real ceremonies and colours — marigold and red for North Indian weddings, kasavu gold for Kerala, ivory and gold for church weddings, emerald for Nikah. You can explain rituals to guests from other cultures with ready-made ritual descriptions.",
        "Introduce both families, the wedding party and close relatives with photos and short bios, so guests know who is who.",
      ]},
      { h2: "Everything guests ask you, answered on one page", paras: [
        "Where is the venue? What should I wear? Is there a hotel block? Can I bring my children? Add schedules, maps, accommodation, travel tips and FAQs once, and stop answering the same questions on the phone.",
        "After the wedding, guests can upload photos to a shared album and leave blessings for the couple.",
      ]},
    ],
    checklist: ["250+ themes across Indian traditions", "Multiple functions with separate RSVPs", "Family and wedding-party introductions", "Guest photo album and blessing wall", "Multi-language site translation", "Password protection for private weddings", "Seating planner and live photo wall"],
    faqs: [
      { q: "What should an Indian wedding website include?", a: "Your names and date, every function with time and venue, a Google Maps link, dress codes, your story, family introductions, a photo gallery, accommodation details and an RSVP form." },
      { q: "Can I make a wedding website for free?", a: "Yes, you can build and preview your website free with a 7-day trial before choosing a plan." },
      { q: "Can guests RSVP for specific functions?", a: "Yes. Guests tick which functions they will attend — for example only the reception — and you see counts for each one." },
      { q: "Can I keep my wedding website private?", a: "Yes. You can add a password so only invited guests can open it." },
      { q: "Does it work in Hindi, Malayalam, Tamil or other languages?", a: "Yes. You can translate your site so guests read it in their preferred language." },
    ],
    related: [{ to: "/themes", label: "Browse wedding website themes" }, { to: "/whatsapp-wedding-invitation", label: "WhatsApp wedding invitation" }, { to: "/showcase", label: "See real examples" }, { to: "/tools", label: "Free planning tools" }],
  },
};

export default function SeoLanding({ page }: { page: "whatsapp" | "indian" }) {
  const p = PAGES[page];
  const url = `https://vowz.me${p.path}`;
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const howLd = { "@context": "https://schema.org", "@type": "HowTo", name: p.h1, step: p.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })) };
  return (
    <div className="bg-background">
      <SEOHead title={p.title} description={p.description} canonical={url}>
        <meta name="keywords" content={p.keywords} />
      </SEOHead>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
        <script type="application/ld+json">{JSON.stringify(howLd)}</script>
      </Helmet>

      <section className="container mx-auto px-4 pt-24 pb-12 max-w-4xl text-center">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">{p.h1}</h1>
        <p className="mt-5 text-lg text-muted-foreground">{p.intro}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link to="/themes">Start free</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/showcase">See examples</Link></Button>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <h2 className="text-2xl font-display font-bold text-center mb-6">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {p.steps.map((s, i) => (
            <Card key={s.title}><CardContent className="p-5 space-y-2">
              <s.icon className="h-6 w-6 text-accent" />
              <h3 className="font-semibold">{i + 1}. {s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </CardContent></Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 max-w-3xl space-y-8">
        {p.sections.map((s) => (
          <div key={s.h2}>
            <h2 className="text-2xl font-display font-bold mb-3">{s.h2}</h2>
            {s.paras.map((t, i) => <p key={i} className="text-muted-foreground mb-3 leading-relaxed">{t}</p>)}
          </div>
        ))}
        {p.sample && (
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold mb-2">{p.sample.label}</h2>
            <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">{p.sample.text}</pre>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-display font-bold mb-3">What you get</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {p.checklist.map((c) => <li key={c} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />{c}</li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold mb-3">Frequently asked questions</h2>
          <div className="space-y-2">
            {p.faqs.map((f) => (
              <details key={f.q} className="rounded-lg border bg-card p-4">
                <summary className="font-medium cursor-pointer">{f.q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <nav aria-label="Related pages" className="flex flex-wrap gap-2">
          {p.related.map((r) => <Link key={r.to} to={r.to} className="text-sm rounded-full border px-3 py-1 hover:border-accent">{r.label}</Link>)}
        </nav>
      </section>

      <section className="container mx-auto px-4 pb-20 text-center">
        <div className="rounded-2xl bg-primary text-primary-foreground p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold">Ready to invite your guests?</h2>
          <p className="mt-2 opacity-90">Free 7-day trial. No design skills needed.</p>
          <Button asChild size="lg" variant="secondary" className="mt-5"><Link to="/themes">Create yours now</Link></Button>
        </div>
      </section>
    </div>
  );
}
