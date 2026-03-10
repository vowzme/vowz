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
    a: "Yes! Our free plan includes the AI wizard, 5 templates, 50 photo uploads, RSVP management, QR invites, and a vowz.co subdomain — forever, no credit card required.",
  },
  {
    q: "How does the AI Wedding Wizard work?",
    a: "Simply answer a few questions about your wedding — names, cultural background, love story, and ceremony details. Our AI generates a complete, personalized wedding website in under 5 minutes that you can edit anytime.",
  },
  {
    q: "Can I use my own domain like ournames.com?",
    a: "Absolutely! Premium users can connect a custom domain. We guide you through DNS setup and handle SSL certificates automatically.",
  },
  {
    q: "What types of weddings does Vowz support?",
    a: "Vowz supports all wedding styles — traditional Indian (Hindu, Muslim, Sikh, Christian), fusion, destination, eco-friendly, and more. Our AI adapts to your cultural background and includes relevant ceremony events.",
  },
  {
    q: "Can guests RSVP through my wedding site?",
    a: "Yes! Every site includes an RSVP form where guests can confirm attendance, select events, choose meal preferences, and leave messages. You can track all responses in your dashboard.",
  },
  {
    q: "Is my wedding site mobile-friendly?",
    a: "100%. Every Vowz site is fully responsive and optimized for phones, tablets, and desktops. Most guests will view your site on their phone, and it looks beautiful on every screen.",
  },
  {
    q: "Can I add photos and videos?",
    a: "Free users get 50 photo uploads. Premium users get 5GB of storage for photos and videos, including support for video embeds from YouTube or Vimeo.",
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