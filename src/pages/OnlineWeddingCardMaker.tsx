import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Palette, Send, QrCode, Smartphone, Download } from "lucide-react";

const CANONICAL = "https://vowz.me/online-wedding-card-maker";

const steps = [
  {
    icon: Palette,
    title: "Pick a wedding card design",
    body:
      "Start from a ready-made template — traditional Hindu, Muslim, Christian, minimal or floral — and change the colours, fonts and photo framing until it feels like yours.",
  },
  {
    icon: Smartphone,
    title: "Add your names, dates and events",
    body:
      "Type in the couple's names, muhurat or ceremony timings, venue address and a Google Maps link. Every edit shows instantly in the live preview.",
  },
  {
    icon: QrCode,
    title: "Attach RSVP and a QR code",
    body:
      "Your card can carry a scannable QR code and an RSVP link, so guests confirm attendance, meal choice and plus-ones without a single phone call.",
  },
  {
    icon: Send,
    title: "Share on WhatsApp — or print it",
    body:
      "Send the card straight to WhatsApp, email or Instagram, or export a print-ready PDF with bleed for your printer.",
  },
];

const features = [
  "Free to start — design and preview your card before paying anything",
  "Works on phone and laptop, no design software needed",
  "High-resolution PNG, JPG and print-ready PDF downloads",
  "Matching wedding website with schedule, gallery and RSVP",
  "Per-guest invite links that pre-fill names and plus-ones",
  "Multi-language card text for bilingual families",
];

const faqs = [
  {
    q: "Is the online wedding card maker free?",
    a: "Yes — you can design, style and preview your wedding card for free. You only pay when you want to download high-resolution files, remove branding or publish your full wedding website.",
  },
  {
    q: "Can I send the wedding card on WhatsApp?",
    a: "Yes. Every card gets a shareable link and an image export, and there's a one-tap WhatsApp share so you can forward it to family groups directly.",
  },
  {
    q: "Can I print the invitation?",
    a: "Yes. Export a print-ready PDF at 300 DPI with bleed marks, which any local press can use for physical cards.",
  },
  {
    q: "Do guests need an app to RSVP?",
    a: "No. Guests tap the link, see your card and reply in the browser. You see every response, meal preference and dietary note in your dashboard.",
  },
];

const OnlineWeddingCardMaker = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Online Wedding Card Maker — Design & Share Free | Vowz"
        description="Create your wedding invitation online in minutes. Free online wedding card maker with Indian templates, WhatsApp sharing, RSVP, QR codes and print-ready PDF downloads."
        canonical={CANONICAL}
        ogUrl={CANONICAL}
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          })}
        </script>
      </SEOHead>

      <section className="container mx-auto px-4 py-16 md:py-24 text-center max-w-3xl">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Online wedding card maker
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
          Make your wedding invitation card online — free
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Design a beautiful digital wedding card in minutes, share it on WhatsApp,
          collect RSVPs automatically and download a print-ready file when you need one.
          No designer, no software, no waiting.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/auth">Start designing free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/card-gallery">Browse card designs</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="font-serif text-3xl font-bold mb-8 text-center">
          How to create a wedding card online in 4 steps
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((s, i) => (
            <Card key={s.title}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold text-lg">
                    {i + 1}. {s.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <h2 className="font-serif text-3xl font-bold mb-6 text-center">
          What you get with the Vowz card maker
        </h2>
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/templates">Wedding website templates</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/pricing">See pricing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/blog/online-wedding-card-maker-guide">
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Read the full guide
            </Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <h2 className="font-serif text-3xl font-bold mb-6 text-center">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold mb-2">{f.q}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <h2 className="font-serif text-3xl font-bold mb-4">
          Your invitation is 10 minutes away
        </h2>
        <p className="text-muted-foreground mb-6">
          Design your card, share the link with family, and watch the RSVPs arrive.
        </p>
        <Button asChild size="lg">
          <Link to="/auth">Create my wedding card</Link>
        </Button>
      </section>
    </div>
  );
};

export default OnlineWeddingCardMaker;
