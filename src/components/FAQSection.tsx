import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is Vowz really free?",
    a: "Yes! Our free plan includes the wedding wizard, 25 templates, 50 photo uploads, RSVP management, QR invites, countdown timer, guestbook, budget tracker, wedding checklist, guest polls, and a vowz.me subdomain — forever, no credit card required.",
  },
  {
    q: "How does the Wedding Wizard work?",
    a: "Answer a few simple questions — your names, cultural background, love story, and ceremony details. Vowz generates a complete, personalized wedding website in under 5 minutes with all your events pre-filled. You can edit everything anytime in the visual editor.",
  },
  {
    q: "What AI features does Vowz offer?",
    a: "Premium users get an AI assistant built into the editor. It can suggest color palettes and themes based on your culture and venue, rewrite your love story or tagline, generate event descriptions, and offer wedding planning advice — all with one click to apply changes.",
  },
  {
    q: "Can I use my own domain like ournames.com?",
    a: "Yes! Premium users can connect a custom domain through our guided 4-step wizard. Search for available domains, purchase from popular registrars (GoDaddy, BigRock, Hostinger, Namecheap), follow our DNS setup guide, and verify — we handle SSL automatically.",
  },
  {
    q: "What types of weddings does Vowz support?",
    a: "Vowz supports all wedding styles — traditional Indian (Hindu, Muslim, Sikh, Christian), fusion, destination, eco-friendly, and more. The wizard adapts to your cultural background and includes relevant ceremony events like Mehendi, Sangeet, and Pheras.",
  },
  {
    q: "Can guests RSVP through my wedding site?",
    a: "Yes! Every site includes an RSVP form where guests can confirm attendance, select specific events, choose meal preferences (veg/non-veg/vegan), and leave messages. You can track all responses in real-time from your dashboard.",
  },
  {
    q: "What planning tools are included?",
    a: "Beyond the wedding website, Vowz includes a budget & expense tracker across 13 categories, a pre-seeded wedding checklist, interactive guest polls, visitor analytics, and a getting-started guide — all accessible from your dashboard.",
  },
  {
    q: "Is my wedding site mobile-friendly?",
    a: "100%. Every Vowz site is fully responsive and optimized for phones, tablets, and desktops. Most guests will view your site on their phone, and it looks beautiful on every screen.",
  },
  {
    q: "Can I add photos and videos?",
    a: "Free users get 50 photo uploads with a built-in gallery and lightbox viewer. Video embed support and expanded 5GB storage for photos and videos are coming soon with Premium.",
  },
  {
    q: "What happens to my site after the wedding?",
    a: "Your site stays live as a digital keepsake for as long as you want. The guestbook messages, photos, and memories are yours to keep forever.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-16 sm:py-24 px-4" id="faq">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
            Common Questions
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently <span className="text-gradient-gold italic">Asked</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body">
            Everything you need to know about creating your wedding website with Vowz.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border/50 rounded-xl px-6 shadow-card data-[state=open]:shadow-elegant transition-shadow"
              >
                <AccordionTrigger className="font-display text-base sm:text-lg font-semibold text-foreground hover:no-underline py-5 text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="font-body text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
