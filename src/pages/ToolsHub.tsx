import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Printer, Sparkles, Clock, LockOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { FREE_TOOLS } from "@/lib/free-tools";

const ToolsHub = () => {
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free Indian wedding planning tools",
    itemListElement: FREE_TOOLS.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `https://vowz.me/tools/${t.slug}`,
    })),
  };

  return (
    <>
      <SEOHead
        title="Free Wedding Planning Tools — No Sign-Up Needed | Vowz"
        description="Seven free Indian wedding planning tools: menu builder, sangeet song finder, vendor questions, ritual explainer, hidden cost check, message writer and final-week checklist. No login, printable results."
        canonical="https://vowz.me/tools"
        ogUrl="https://vowz.me/tools"
        ogTitle="Free Indian Wedding Planning Tools — No Sign-Up"
        ogDescription="Menus, songs, vendor questions, rituals, hidden costs, guest messages and the final week — seven free tools with printable results."
      >
        <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
      </SEOHead>

      <div className="min-h-screen bg-background">
        <Navbar />

        <section className="pt-28 pb-14 sm:pt-32 sm:pb-20 px-4 bg-gradient-warm">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">Free Tools · No sign-up</p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-foreground mb-4">
                Small tools that make the <span className="text-gradient-gold italic">big day easier</span>
              </h1>
              <p className="text-muted-foreground font-body max-w-2xl mx-auto mb-6">
                Answer a few questions, leave with something you can actually print, WhatsApp to your family, or hand to a vendor.
                No account, no email, nothing saved.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-sm font-body">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-muted-foreground">
                  <LockOpen className="h-3.5 w-3.5 text-accent" /> No login
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-muted-foreground">
                  <Printer className="h-3.5 w-3.5 text-accent" /> Printable output
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-accent" /> Under 3 minutes each
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FREE_TOOLS.map((tool, i) => (
                <motion.div
                  key={tool.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/tools/${tool.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
                  >
                    <div className="text-3xl mb-3" aria-hidden="true">{tool.emoji}</div>
                    <h2 className="font-display text-lg font-semibold text-foreground mb-1.5">{tool.name}</h2>
                    <p className="font-body text-sm text-muted-foreground flex-1">{tool.tagline}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                      <span className="font-body text-xs text-muted-foreground">You get: {tool.output}</span>
                      <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <Link
                  to="/wedding-report"
                  className="group flex h-full flex-col rounded-2xl border-2 border-accent/60 bg-accent/5 p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
                >
                  <div className="text-3xl mb-3" aria-hidden="true">🧭</div>
                  <h2 className="font-display text-lg font-semibold text-foreground mb-1.5">Free Wedding Report</h2>
                  <p className="font-body text-sm text-muted-foreground flex-1">
                    Eight minutes of questions, and you walk away knowing your budget split, your timeline, your readiness score and where the gaps are.
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-accent/30 pt-3">
                    <span className="font-body text-xs font-semibold text-accent">Most popular</span>
                    <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto rounded-2xl border border-border/60 bg-card p-6 sm:p-8 text-center shadow-card">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-accent" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Turn all of this into one link for your guests</h2>
            <p className="font-body text-muted-foreground mb-5">
              Your menu, your ceremonies, your timings, RSVP and photos — on one beautiful wedding website your family opens again and again.
            </p>
            <Button asChild size="lg" className="rounded-full">
              <Link to="/templates">See the templates</Link>
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default ToolsHub;
