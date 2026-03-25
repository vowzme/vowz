import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Network, Users, IndianRupee, DollarSign, ArrowRight, Shield,
  Clock, Zap, QrCode, Star, Sparkles, ChevronRight, CheckCircle2,
  TrendingUp, Globe, BadgeCheck, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import VowzLogo from "@/components/VowzLogo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const FRANCHISE_EARNINGS = {
  IN: { override: "₹49.95", ownComm: "₹250", base: "₹999", symbol: "₹" },
  INTL: { override: "$1", ownComm: "$5", base: "$20", symbol: "$" },
};

export default function FranchiseLanding() {
  const [user, setUser] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadAffiliate(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadAffiliate(session.user.id);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadAffiliate = async (userId: string) => {
    const { data } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setAffiliate(data);
    setLoading(false);
  };

  const handleApplyForFranchise = async () => {
    if (!user) {
      toast({ title: "Please sign in first", description: "You need an account to apply for franchise partnership.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!affiliate) {
      toast({ title: "Become an affiliate first", description: "You need to join the affiliate program before applying for franchise status.", variant: "destructive" });
      navigate("/affiliate");
      return;
    }

    if (affiliate.is_franchise && affiliate.franchise_approved) {
      navigate("/franchise/dashboard");
      return;
    }

    if (affiliate.is_franchise && !affiliate.franchise_approved) {
      toast({ title: "Application pending ⏳", description: "Your franchise application is under review. We'll notify you once approved." });
      return;
    }

    // Check if user has premium
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("status, expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const isPremium = sub && (!sub.expires_at || new Date(sub.expires_at) > new Date());

    if (!isPremium) {
      toast({
        title: "Premium required",
        description: "Franchise partnership is available for Premium plan users. Upgrade to apply, or contact us for admin approval.",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);
    const { error } = await supabase
      .from("affiliates")
      .update({ is_franchise: true, franchise_approved: false })
      .eq("id", affiliate.id);

    if (error) {
      toast({ title: "Application failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Application submitted! 🎉",
        description: "Your franchise partner application is under review. We'll approve it within 24-48 hours.",
      });
      setAffiliate({ ...affiliate, is_franchise: true, franchise_approved: false });
    }
    setApplying(false);
  };

  const isFranchise = affiliate?.is_franchise;
  const isApproved = affiliate?.franchise_approved;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Franchise Partner Program – Vowz | Build Your Network & Earn"
        description="Become a Vowz Franchise Partner. Earn 25% affiliate commission + 5% override on all sub-affiliate sales. Build your own affiliate network and grow your income."
        ogTitle="Vowz Franchise Partner Program"
        ogDescription="Build your own affiliate network with Vowz. Earn 25% on your sales + 5% override on your team's sales."
        ogUrl="https://vowz.me/franchise"
        canonical="https://vowz.me/franchise"
        robots="index, follow"
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.03]" />
        <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 left-[5%] w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16">
          <motion.div initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-5 py-2 rounded-full mb-8">
              <Network className="w-4 h-4" />
              <span className="font-body text-sm font-semibold tracking-wide">Franchise Partner Program</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6">
              Build Your{" "}
              <span className="relative inline-block">
                <span className="text-gradient-gold">Network</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                </svg>
              </span>
              {" "}&amp; Earn More
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground font-body text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Go beyond standard affiliate earnings. As a Franchise Partner, recruit your own team of affiliates and earn{" "}
              <strong className="text-foreground">5% override commission</strong> on every sale they make — on top of your own 25% affiliate earnings.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
              {loading ? (
                <Button variant="gold" size="xl" disabled>
                  <div className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin mr-2" />
                  Loading...
                </Button>
              ) : isFranchise && isApproved ? (
                <Button variant="gold" size="xl" onClick={() => navigate("/franchise/dashboard")}>
                  Go to Franchise Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : isFranchise && !isApproved ? (
                <Button variant="gold" size="xl" disabled className="opacity-80">
                  <Clock className="w-4 h-4 mr-2" /> Application Under Review
                </Button>
              ) : (
                <Button variant="gold" size="xl" onClick={handleApplyForFranchise} disabled={applying}>
                  {applying ? "Submitting..." : "Apply as Franchise Partner"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              <Button variant="heroOutline" size="xl" onClick={() => document.getElementById("how-franchise-works")?.scrollIntoView({ behavior: "smooth" })}>
                Learn More
              </Button>
            </motion.div>

            {!user && (
              <motion.p variants={fadeUp} custom={4} className="text-xs text-muted-foreground font-body mt-4">
                Already a franchise partner? <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link> to access your dashboard.
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Earnings Comparison */}
      <section className="border-y border-border/40 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center mb-8">
            <p className="font-body text-sm font-semibold text-primary uppercase tracking-widest mb-2">Earnings Potential</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Two Revenue Streams, One Dashboard</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Own Sales */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-background border border-accent/30 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">Your Own Sales</h3>
              <p className="font-display text-3xl font-bold text-accent mb-1">25% commission</p>
              <p className="font-body text-sm text-muted-foreground mb-3">
                Same as any affiliate partner — earn {FRANCHISE_EARNINGS.IN.ownComm} (India) or {FRANCHISE_EARNINGS.INTL.ownComm} (International) per premium upgrade from your direct referrals.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Lifetime attribution on referrals
              </div>
            </motion.div>

            {/* Override */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-background border border-primary/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-[10px] font-body font-semibold">FRANCHISE EXCLUSIVE</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Network className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">Sub-Affiliate Override</h3>
              <p className="font-display text-3xl font-bold text-primary mb-1">5% override</p>
              <p className="font-body text-sm text-muted-foreground mb-3">
                Earn {FRANCHISE_EARNINGS.IN.override} (India) or {FRANCHISE_EARNINGS.INTL.override} (International) on every sale your sub-affiliates make — calculated on the original price.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Passive income from your network
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-franchise-works" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body text-sm font-semibold text-primary uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
            <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-px bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />

            {[
              { icon: BadgeCheck, step: "01", title: "Get Approved", desc: "Apply as a Franchise Partner (Premium plan required). Admin reviews and approves within 24-48 hours." },
              { icon: QrCode, step: "02", title: "Share Your QR/Link", desc: "Get a unique franchise recruitment link and branded QR code. Share with potential affiliates." },
              { icon: UserPlus, step: "03", title: "Build Your Team", desc: "When someone signs up as an affiliate using your link, they automatically become your sub-affiliate." },
              { icon: IndianRupee, step: "04", title: "Earn Overrides", desc: "Every time a sub-affiliate makes a sale, you earn 5% override commission on the original price — automatically!" },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative text-center px-6 py-8"
              >
                <div className="relative mx-auto mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-foreground text-background rounded-lg flex items-center justify-center font-display text-xs font-bold">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-foreground mb-2">{step.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card/50 border-y border-border/40 py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-body text-sm font-semibold text-primary uppercase tracking-widest mb-3">What You Get</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Franchise Partner Benefits</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, title: "Dual Revenue", desc: "Earn from your own sales AND from your team's sales. Two income streams from one platform." },
              { icon: QrCode, title: "Branded QR Code", desc: "Get your own QR code to recruit affiliates. Print it, share it digitally — affiliates auto-link to you." },
              { icon: Globe, title: "Global Reach", desc: "Recruit affiliates from India or internationally. Commissions calculated in local currency." },
              { icon: Shield, title: "Real-Time Dashboard", desc: "Track sub-affiliates, their sales, your override earnings — all in one place." },
              { icon: Clock, title: "48-Hour Payouts", desc: "All commissions settled within 48 hours via UPI/GPay (India) or PayPal (International)." },
              { icon: Users, title: "Unlimited Network", desc: "No cap on how many affiliates you can onboard. The more you recruit, the more you earn." },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-background border border-border/50 rounded-2xl p-5 hover:shadow-card transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-sm font-bold text-foreground mb-1">{feature.title}</h3>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-body text-sm font-semibold text-primary uppercase tracking-widest mb-3">Earnings Example</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">See What You Could Earn</h2>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* India */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🇮🇳</span>
                  <h3 className="font-display text-lg font-bold text-foreground">India Earnings</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="font-body text-sm text-muted-foreground">Your own sales (10/month)</span>
                    <span className="font-display text-sm font-bold text-foreground">₹2,500/mo</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="font-body text-sm text-muted-foreground">5 sub-affiliates × 5 sales each</span>
                    <span className="font-display text-sm font-bold text-primary">₹1,249/mo</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-primary/5 rounded-lg px-3">
                    <span className="font-body text-sm font-semibold text-foreground">Total Monthly</span>
                    <span className="font-display text-lg font-bold text-primary">₹3,749/mo</span>
                  </div>
                </div>
              </div>

              {/* International */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🌍</span>
                  <h3 className="font-display text-lg font-bold text-foreground">International Earnings</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="font-body text-sm text-muted-foreground">Your own sales (10/month)</span>
                    <span className="font-display text-sm font-bold text-foreground">$50/mo</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="font-body text-sm text-muted-foreground">5 sub-affiliates × 5 sales each</span>
                    <span className="font-display text-sm font-bold text-primary">$25/mo</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-primary/5 rounded-lg px-3">
                    <span className="font-body text-sm font-semibold text-foreground">Total Monthly</span>
                    <span className="font-display text-lg font-bold text-primary">$75/mo</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground font-body mt-6 text-center">
              * Example calculation only. Actual earnings depend on number of sales. Override commission is 5% of original price (₹999 / $20), not discounted price.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card/50 border-t border-border/40 py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-body text-xs font-semibold">Limited Spots Available</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Build Your Network?
          </h2>
          <p className="text-muted-foreground font-body text-base mb-8">
            Join as a Franchise Partner today and start earning from your own sales and your team's sales. Premium plan required.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isFranchise && isApproved ? (
              <Button variant="gold" size="xl" onClick={() => navigate("/franchise/dashboard")}>
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="gold" size="xl" onClick={handleApplyForFranchise} disabled={applying}>
                {applying ? "Submitting..." : "Apply as Franchise Partner"} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            <Link to="/affiliate">
              <Button variant="heroOutline" size="xl">
                Join as Affiliate Instead <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {!user && (
            <p className="text-xs text-muted-foreground font-body mt-4">
              Already a partner? <Link to="/auth" className="text-primary hover:underline font-medium">Sign in here</Link>
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "Who can become a Franchise Partner?", a: "Any user with an active Premium plan can apply. Admin may also grant franchise status on a case-by-case basis." },
              { q: "Do I still earn affiliate commission as a Franchise Partner?", a: "Yes! You earn the standard 25% affiliate commission on your own direct referral sales, plus an additional 5% override on all sub-affiliate sales." },
              { q: "How does the 5% override work?", a: "When any affiliate in your network makes a sale, you automatically earn 5% of the original price (₹49.95 per ₹999 sale in India, $1 per $20 sale internationally). This is calculated on the original price, not the discounted amount." },
              { q: "How do sub-affiliates join my network?", a: "Share your franchise recruitment link or QR code. When someone signs up as an affiliate through it, they're automatically linked to your network." },
              { q: "When do I get paid?", a: "All commissions (affiliate + franchise override) are settled within 48 hours. Payouts are via UPI/GPay for India or PayPal for international partners." },
              { q: "Can I see my sub-affiliates' customer details?", a: "No. You can only see basic info: name, email, signup date, and sales figures. Full customer and website details are private." },
            ].map((faq, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-2xl p-5">
                <h3 className="font-display text-sm font-bold text-foreground mb-2">{faq.q}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
