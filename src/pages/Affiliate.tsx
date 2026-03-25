import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, IndianRupee, TrendingUp, Copy, Check, Gift,
  Link as LinkIcon, Tag, ArrowRight, Shield, Clock, Zap,
  LogOut, Eye, EyeOff, Star, Sparkles, BadgePercent, ChevronRight,
  QrCode, Download, DollarSign, Wallet, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateReferralCode, getStoredFranchiseRef, clearStoredFranchiseRef } from "@/hooks/use-affiliate";
import SEOHead from "@/components/SEOHead";
import VowzLogo from "@/components/VowzLogo";
import { QRCodeCanvas } from "qrcode.react";
import { usePricingRegion, type PricingRegion } from "@/hooks/use-pricing-region";

// 25% commission on subscription fee, 15% customer discount
const COMMISSION = {
  IN: { amount: Math.round(999 * 0.25), symbol: "₹", label: `₹${Math.round(999 * 0.25)}` },
  INTL: { amount: Math.round(20 * 0.25 * 100) / 100, symbol: "$", label: `$${Math.round(20 * 0.25 * 100) / 100}` },
};
const CUSTOMER_DISCOUNT = {
  IN: { amount: Math.round(999 * 0.15), final: 999 - Math.round(999 * 0.15), symbol: "₹" },
  INTL: { amount: Math.round(20 * 0.15 * 100) / 100, final: 20 - Math.round(20 * 0.15 * 100) / 100, symbol: "$" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const Affiliate = () => {
  const [user, setUser] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customCoupon, setCustomCoupon] = useState("");
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Dashboard country selector
  const [dashRegion, setDashRegion] = useState<PricingRegion>("IN");
  const commission = COMMISSION[dashRegion];

  // Payout info
  const [payoutUpi, setPayoutUpi] = useState("");
  const [payoutPaypal, setPayoutPaypal] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAffiliateData(session.user.id);
      } else {
        setAffiliate(null);
        setReferrals([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAffiliateData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAffiliateData = async (userId: string) => {
    setLoading(true);
    const { data: aff } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (aff) {
      setAffiliate(aff);
      setCustomCoupon(aff.custom_coupon || "");
      setPayoutUpi((aff as any).payout_upi || "");
      setPayoutPaypal((aff as any).payout_paypal || "");
      const { data: refs } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false });
      setReferrals(refs || []);
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: "https://vowz.me/affiliate",
      },
    });
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      setAuthLoading(false);
      return;
    }
    toast({
      title: "Check your email! 📧",
      description: "We've sent a verification link. Verify your email to complete registration.",
    });
    setAuthLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      setAuthLoading(false);
      return;
    }
    if (data.user) {
      const { data: aff } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (!aff) {
        toast({ title: "No affiliate account found", description: "Please sign up as an affiliate partner first.", variant: "destructive" });
        await supabase.auth.signOut();
        setAuthLoading(false);
        return;
      }
    }
    setAuthLoading(false);
  };

  const handleRegisterAsAffiliate = async () => {
    if (!user) return;
    setAuthLoading(true);
    const code = generateReferralCode(fullName || user.email || "");

    // Check if there's a franchise referral stored
    const franchiseRef = getStoredFranchiseRef() || new URLSearchParams(window.location.search).get("franchise");
    let franchiseId: string | null = null;

    if (franchiseRef) {
      const { data: franchiseAff } = await (supabase as any)
        .from("affiliates")
        .select("id")
        .eq("referral_code", franchiseRef.trim().toLowerCase())
        .eq("is_franchise", true)
        .eq("franchise_approved", true)
        .maybeSingle();
      if (franchiseAff) {
        franchiseId = franchiseAff.id;
      }
    }

    const insertData: any = {
      user_id: user.id,
      full_name: fullName || user.user_metadata?.full_name || "",
      email: user.email || email,
      phone: phone || null,
      referral_code: code,
    };
    if (franchiseId) {
      insertData.franchise_id = franchiseId;
    }

    const { error } = await supabase.from("affiliates").insert(insertData as any);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      clearStoredFranchiseRef();
      const msg = franchiseId
        ? "You're now a Vowz affiliate partner, linked to a franchise network!"
        : "You're now a Vowz affiliate partner.";
      toast({ title: "Welcome aboard! 🎉", description: msg });
      await loadAffiliateData(user.id);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAffiliate(null);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied! 📋" });
  };

  const handleSaveCoupon = async () => {
    if (!affiliate || !customCoupon.trim()) return;
    const coupon = customCoupon.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (coupon.length < 3) {
      toast({ title: "Coupon must be at least 3 characters", variant: "destructive" });
      return;
    }
    setSavingCoupon(true);
    const { error } = await supabase
      .from("affiliates")
      .update({ custom_coupon: coupon } as any)
      .eq("id", affiliate.id);
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast({ title: "This coupon code is already taken", variant: "destructive" });
      } else {
        toast({ title: "Failed to save coupon", description: error.message, variant: "destructive" });
      }
    } else {
      setAffiliate({ ...affiliate, custom_coupon: coupon });
      toast({ title: "Coupon saved! 🎫" });
    }
    setSavingCoupon(false);
  };

  const handleSavePayout = async () => {
    if (!affiliate) return;
    setSavingPayout(true);
    const { error } = await supabase
      .from("affiliates")
      .update({ payout_upi: payoutUpi || null, payout_paypal: payoutPaypal || null } as any)
      .eq("id", affiliate.id);
    if (error) {
      toast({ title: "Failed to save payout info", description: error.message, variant: "destructive" });
    } else {
      setAffiliate({ ...affiliate, payout_upi: payoutUpi, payout_paypal: payoutPaypal });
      toast({ title: "Payout info saved! ✅" });
    }
    setSavingPayout(false);
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `vowz-affiliate-qr-${affiliate.referral_code}.png`;
    link.href = url;
    link.click();
    toast({ title: "QR code downloaded! 📱" });
  };

  const referralLink = affiliate
    ? `https://vowz.me/?ref=${affiliate.referral_code}`
    : "";
  const couponLink = affiliate?.custom_coupon
    ? `https://vowz.me/?coupon=${affiliate.custom_coupon}`
    : "";

  const successfulRefs = referrals.filter((r) => r.status === "converted");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Vowz Affiliate Program – Earn 25% Commission Per Referral"
        description="Join the Vowz affiliate program and earn 25% commission on every successful wedding website referral. Free to join, lifetime attribution, real-time dashboard."
        ogTitle="Vowz Affiliate Program – Earn Per Referral"
        ogDescription="Earn ₹250 or $5 per successful referral. Join our wedding invitation affiliate program — free to join with lifetime attribution and real-time tracking."
        ogImage="https://vowz.me/og-affiliate.jpg"
        ogUrl="https://vowz.me/affiliate"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Vowz Affiliate – Earn Per Referral"
        twitterDescription="Join our affiliate program and earn per wedding website referral. Free to join."
        twitterImage="https://vowz.me/og-affiliate.jpg"
        canonical="https://vowz.me/affiliate"
        robots="index, follow"
      />
      {/* Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <VowzLogo iconSize="h-6" textSize="text-lg" />
          </Link>
          <span className="text-border mx-2">|</span>
          <span className="font-body text-sm text-muted-foreground">Affiliate Program</span>
          <div className="flex-1" />
          {user && affiliate && (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
            </Button>
          )}
        </div>
      </header>

      {/* ═══ LANDING SECTION ═══ */}
      {(!user || !affiliate) && (
        <>
          {/* Hero */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-hero opacity-[0.03]" />
            <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-accent/5 blur-3xl" />
            <div className="absolute bottom-10 left-[5%] w-96 h-96 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16">
              <motion.div
                initial="hidden"
                animate="visible"
                className="text-center max-w-3xl mx-auto"
              >
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 px-5 py-2 rounded-full mb-8">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-body text-sm font-semibold tracking-wide">Affiliate Partnership Program</span>
                </motion.div>

                <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6">
                  Earn{" "}
                  <span className="relative inline-block">
                    <span className="text-gradient-gold">25%</span>
                    <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                      <path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--accent))" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                    </svg>
                  </span>
                  {" "}Per Referral
                </motion.h1>

                <motion.p variants={fadeUp} custom={2} className="text-muted-foreground font-body text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                  Share the joy of beautiful wedding websites and earn commission for every successful premium subscription. Your referred users also get a discount!
                </motion.p>

                <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="gold" size="xl" onClick={() => document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" })}>
                    Start Earning Today <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button variant="heroOutline" size="xl" className="border-border text-foreground hover:bg-muted/50" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                    Learn How It Works
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Social Proof Bar */}
          <section className="border-y border-border/40 bg-card/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
              {[
                { value: "500+", label: "Active Partners" },
                { value: "₹2L+", label: "Paid Out" },
                { value: "98%", label: "Satisfaction Rate" },
                { value: "24hr", label: "Tracking Speed" },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="text-center">
                  <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="text-center mb-14">
                <motion.p variants={fadeUp} custom={0} className="font-body text-sm font-semibold text-accent uppercase tracking-widest mb-3">Simple Process</motion.p>
                <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl sm:text-4xl font-bold text-foreground">How It Works</motion.h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 relative">
                <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0" />

                {[
                  { icon: LinkIcon, step: "01", title: "Share Your Link or QR", desc: "Get a unique referral link, QR code, or create a custom coupon code to share with your audience." },
                  { icon: Users, step: "02", title: "Friends Sign Up & Save", desc: `When someone signs up using your link, they get 15% off Premium (₹${CUSTOMER_DISCOUNT.IN.amount} / $${CUSTOMER_DISCOUNT.INTL.amount}). They're permanently tracked as your referral.` },
                  { icon: IndianRupee, step: "03", title: "Earn 25% Commission", desc: `When your referral upgrades, you earn 25% commission — ₹${COMMISSION.IN.amount} (India) or $${COMMISSION.INTL.amount} (International). Even if they upgrade months later!` },
                ].map((step, i) => (
                  <motion.div
                    key={step.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i}
                    className="relative text-center px-6 py-8 group"
                  >
                    <div className="relative mx-auto mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto transition-all group-hover:shadow-gold group-hover:scale-105">
                        <step.icon className="w-7 h-7 text-accent" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground font-body text-xs font-bold flex items-center justify-center">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Grid */}
          <section className="py-16 sm:py-20 px-4 sm:px-6 bg-card/50 border-y border-border/30">
            <div className="max-w-6xl mx-auto">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="text-center mb-14">
                <motion.p variants={fadeUp} custom={0} className="font-body text-sm font-semibold text-accent uppercase tracking-widest mb-3">Benefits</motion.p>
                <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl sm:text-4xl font-bold text-foreground">Why Partner With Us?</motion.h2>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { icon: IndianRupee, title: "25% Commission", desc: `Earn ₹${COMMISSION.IN.amount} (India) or $${COMMISSION.INTL.amount} (International) — 25% of every premium subscription.` },
                  { icon: Clock, title: "Lifetime Attribution", desc: "If a user signs up through your link and upgrades later — even months later — you still earn the commission." },
                  { icon: Tag, title: "Custom Coupon Codes", desc: "Create memorable, branded coupon codes that are easy to share with your audience." },
                  { icon: TrendingUp, title: "Real-Time Dashboard", desc: "Track your referrals, conversions, and earnings with a beautiful, live dashboard." },
                  { icon: Shield, title: "Transparent Tracking", desc: "Every click, signup, and conversion is tracked transparently with detailed reports." },
                  { icon: Zap, title: "Instant Setup", desc: "Get your referral link in under 2 minutes. No approval wait, no paperwork." },
                ].map((benefit, i) => (
                  <motion.div
                    key={benefit.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i}
                    className="group bg-background border border-border/50 rounded-2xl p-6 hover:shadow-elegant hover:border-accent/20 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
                      <benefit.icon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{benefit.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonial / Trust */}
          <section className="py-16 sm:py-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.div variants={fadeUp} custom={0} className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-accent fill-accent" />
                  ))}
                </motion.div>
                <motion.blockquote variants={fadeUp} custom={1} className="font-display text-xl sm:text-2xl text-foreground italic leading-relaxed mb-6">
                  "I started sharing Vowz links in my wedding planning community and earned ₹12,000 in my first month alone. The tracking is seamless and payouts are always on time."
                </motion.blockquote>
                <motion.div variants={fadeUp} custom={2}>
                  <p className="font-body text-sm font-semibold text-foreground">Priya Sharma</p>
                  <p className="font-body text-xs text-muted-foreground">Wedding Planner & Content Creator</p>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </>
      )}

      {/* ═══ AUTH / DASHBOARD ═══ */}
      <div id="auth-section" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !user ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="bg-card border border-border/50 rounded-3xl p-8 sm:p-10 shadow-elegant">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                  <BadgePercent className="w-7 h-7 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                  {authMode === "signup" ? "Join as Affiliate Partner" : "Welcome Back"}
                </h2>
                <p className="text-sm text-muted-foreground font-body">
                  {authMode === "signup" ? "Create your account to start earning" : "Sign in to your affiliate dashboard"}
                </p>
              </div>

              <form onSubmit={authMode === "signup" ? handleSignUp : handleSignIn} className="space-y-4">
                {authMode === "signup" && (
                  <>
                    <div>
                      <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required className="h-11" />
                    </div>
                    <div>
                      <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Phone <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="h-11" />
                    </div>
                  </>
                )}
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11" />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      className="h-11 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button variant="gold" size="lg" className="w-full font-body mt-2" disabled={authLoading}>
                  {authLoading ? "Please wait..." : authMode === "signup" ? "Create Affiliate Account" : "Sign In"}
                  {!authLoading && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground font-body">or</span></div>
              </div>

              <p className="text-center text-sm text-muted-foreground font-body">
                {authMode === "signup" ? "Already a partner?" : "New here?"}{" "}
                <button onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")} className="text-accent hover:underline font-semibold">
                  {authMode === "signup" ? "Sign In" : "Join as Affiliate"}
                </button>
              </p>
            </div>
          </motion.div>
        ) : !affiliate ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="bg-card border border-border/50 rounded-3xl p-8 sm:p-10 shadow-elegant text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-7 h-7 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">Complete Registration</h2>
              <p className="text-sm text-muted-foreground font-body mb-8">
                Signed in as <span className="font-medium text-foreground">{user.email}</span>
              </p>
              <div className="space-y-4 text-left mb-6">
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="h-11" />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Phone <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="h-11" />
                </div>
              </div>
              <Button variant="gold" size="lg" className="w-full font-body" onClick={handleRegisterAsAffiliate} disabled={authLoading}>
                {authLoading ? "Setting up..." : "Register as Affiliate Partner"}
              </Button>
              <button onClick={handleSignOut} className="text-sm text-muted-foreground hover:text-foreground font-body mt-5 block mx-auto transition-colors">
                Sign out
              </button>
            </div>
          </motion.div>
        ) : (
          /* ═══ AFFILIATE DASHBOARD ═══ */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Dashboard Header */}
            <div className="text-center pt-4 pb-2">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 px-4 py-1.5 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-body text-xs font-semibold">Partner Dashboard</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                Welcome, {affiliate.full_name || "Partner"}!
              </h1>
              <p className="text-muted-foreground font-body text-sm mt-2">Track your referrals, earnings, and performance</p>

              {/* Country Selector */}
              <div className="flex justify-center mt-4">
                <div className="inline-flex rounded-full border border-border/60 bg-card p-0.5 shadow-sm">
                  {([
                    { value: "IN" as PricingRegion, label: "India", flag: "🇮🇳" },
                    { value: "INTL" as PricingRegion, label: "International", flag: "🌍" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDashRegion(opt.value)}
                      className={`px-4 py-1.5 text-xs font-body font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                        dashRegion === opt.value
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-sm">{opt.flag}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60 font-body mt-1.5">
                Commission: {commission.label} per upgrade • Customer discount: {CUSTOMER_DISCOUNT[dashRegion].symbol}{CUSTOMER_DISCOUNT[dashRegion].amount} off
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={Users} label="Total Referrals" value={affiliate.total_referrals} accent="accent" />
              <StatCard icon={Check} label="Successful" value={affiliate.successful_referrals} accent="emerald" />
              <StatCard icon={dashRegion === "IN" ? IndianRupee : DollarSign} label="Total Earned" value={`${commission.symbol}${Number(affiliate.total_earnings).toLocaleString()}`} accent="accent" />
              <StatCard icon={Clock} label="Pending" value={`${commission.symbol}${Number(affiliate.pending_earnings).toLocaleString()}`} accent="amber" />
            </div>

            {/* Commission Breakdown */}
            <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-accent" />
                </div>
                Commission Rates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${dashRegion === "IN" ? "border-accent/30 bg-accent/5" : "border-border/40 bg-muted/20"}`}>
                  <p className="font-body text-xs text-muted-foreground mb-1">🇮🇳 India</p>
                  <p className="font-display text-2xl font-bold text-foreground">₹{COMMISSION.IN.amount} <span className="text-sm font-normal text-muted-foreground">per upgrade (25%)</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Customer pays ₹{CUSTOMER_DISCOUNT.IN.final} (₹{CUSTOMER_DISCOUNT.IN.amount} off ₹999 — 15% discount)</p>
                </div>
                <div className={`p-4 rounded-xl border ${dashRegion === "INTL" ? "border-accent/30 bg-accent/5" : "border-border/40 bg-muted/20"}`}>
                  <p className="font-body text-xs text-muted-foreground mb-1">🌍 International</p>
                  <p className="font-display text-2xl font-bold text-foreground">${COMMISSION.INTL.amount} <span className="text-sm font-normal text-muted-foreground">per upgrade (25%)</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Customer pays ${CUSTOMER_DISCOUNT.INTL.final} (${CUSTOMER_DISCOUNT.INTL.amount} off $20 — 15% discount)</p>
                </div>
              </div>
            </div>

            {/* My Affiliate QR & Links */}
            <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-accent" />
                </div>
                My Affiliate QR & Links
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div ref={qrRef} className="bg-white p-4 rounded-2xl border border-border/30 shadow-sm mb-4">
                    <QRCodeCanvas
                      value={referralLink}
                      size={180}
                      level="H"
                      includeMargin
                      imageSettings={{
                        src: "/placeholder.svg",
                        x: undefined,
                        y: undefined,
                        height: 30,
                        width: 30,
                        excavate: true,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-body mb-3 text-center">
                    Scan to sign up with your affiliate discount
                  </p>
                  <Button variant="outline" size="sm" onClick={downloadQR} className="gap-2">
                    <Download className="w-4 h-4" /> Download QR as PNG
                  </Button>
                </div>

                {/* Links */}
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block">Referral Link</label>
                    <div className="bg-muted/40 border border-border/40 rounded-xl p-3 flex items-center gap-3">
                      <code className="font-mono text-xs text-foreground flex-1 truncate select-all">{referralLink}</code>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(referralLink, "link")}>
                        {copiedField === "link" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body mt-1">
                      Code: <code className="font-mono text-foreground font-semibold bg-muted/50 px-1 py-0.5 rounded">{affiliate.referral_code}</code>
                    </p>
                  </div>

                  {couponLink && (
                    <div>
                      <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block">Coupon Link</label>
                      <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 flex items-center gap-3">
                        <Tag className="w-4 h-4 text-accent shrink-0" />
                        <code className="font-mono text-xs text-foreground flex-1 truncate select-all">{couponLink}</code>
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(couponLink, "coupon")}>
                          {copiedField === "coupon" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Coupon */}
            <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-accent" />
                </div>
                Custom Coupon Code
              </h3>
              {affiliate.custom_coupon ? (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-3.5 flex items-center gap-3">
                  <Tag className="w-4 h-4 text-accent shrink-0" />
                  <code className="font-mono text-sm text-foreground font-bold flex-1 uppercase tracking-wider">{affiliate.custom_coupon}</code>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(affiliate.custom_coupon, "couponcode")}>
                    {copiedField === "couponcode" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground font-body">Create a memorable coupon code for your audience.</p>
                  <div className="flex gap-2">
                    <Input
                      value={customCoupon}
                      onChange={(e) => setCustomCoupon(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                      placeholder="e.g. meera-wedding"
                      className="font-mono text-sm h-10"
                      maxLength={30}
                    />
                    <Button variant="gold" size="sm" onClick={handleSaveCoupon} disabled={savingCoupon || customCoupon.length < 3}>
                      {savingCoupon ? "..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    Lowercase letters, numbers, hyphens and underscores only. Min 3 chars.
                  </p>
                </div>
              )}
            </div>

            {/* Payout Information */}
            <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-accent" />
                </div>
                Payout Information
              </h3>
              <p className="text-sm text-muted-foreground font-body mb-4">Add your payout details for commission transfers.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="font-body text-xs font-medium text-foreground mb-1.5 block">🇮🇳 UPI ID / Google Pay Number</label>
                  <Input
                    value={payoutUpi}
                    onChange={(e) => setPayoutUpi(e.target.value)}
                    placeholder="yourname@upi or 9876543210"
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-foreground mb-1.5 block">🌍 PayPal Email</label>
                  <Input
                    type="email"
                    value={payoutPaypal}
                    onChange={(e) => setPayoutPaypal(e.target.value)}
                    placeholder="you@paypal.com"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSavePayout} disabled={savingPayout}>
                {savingPayout ? "Saving..." : "Save Payout Details"}
              </Button>
            </div>

            {/* Referral History */}
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-border/30">
                <h3 className="font-display text-lg font-semibold text-foreground">Referral History</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">
                  {referrals.length === 0
                    ? "No referrals yet. Share your link to start earning!"
                    : `${referrals.length} referral${referrals.length > 1 ? "s" : ""} tracked • ${successfulRefs.length} converted`}
                </p>
              </div>

              {referrals.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        ref.status === "converted" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"
                      }`}>
                        {ref.status === "converted" ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-foreground truncate">
                          {ref.referred_email || "User"}
                        </p>
                        <p className="font-body text-xs text-muted-foreground mt-0.5">
                          {ref.status === "converted"
                            ? `Upgraded to ${ref.plan} • ${commission.symbol}${Number(ref.commission_amount).toLocaleString()} earned`
                            : `Signed up on ${ref.plan} plan • Pending conversion`}
                        </p>
                      </div>
                      <span className="font-body text-xs text-muted-foreground shrink-0 bg-muted/40 px-2.5 py-1 rounded-full">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <p className="font-body text-sm text-muted-foreground mb-1">No referrals yet</p>
                  <p className="font-body text-xs text-muted-foreground/70">Share your referral link and referrals will appear here.</p>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="bg-muted/20 border border-border/30 rounded-2xl p-6 font-body space-y-2">
              <p className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                Affiliate Program Terms
              </p>
              <p className="text-xs text-muted-foreground">• You earn ₹250 (India) or $5 (International) for every referred user who subscribes to Premium.</p>
              <p className="text-xs text-muted-foreground">• Your referred users get ₹250 / $5 discount on Premium (₹749 or $15 final price).</p>
              <p className="text-xs text-muted-foreground">• If a referred user signs up on the free plan and later upgrades, you still earn the commission.</p>
              <p className="text-xs text-muted-foreground">• Commissions are tracked in real-time and paid out monthly to your registered payment method.</p>
              <p className="text-xs text-muted-foreground">• Self-referrals, fraudulent signups, or abuse of the program will result in account termination.</p>
              <p className="text-xs text-muted-foreground">• Vowz reserves the right to modify commission rates with 30 days notice.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  const colorMap: Record<string, string> = {
    accent: "text-accent bg-accent/10 border-accent/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  };
  const colors = colorMap[accent] || colorMap.accent;
  const iconColor = accent === "emerald" ? "text-emerald-500" : accent === "amber" ? "text-amber-500" : "text-accent";

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 hover:shadow-card transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${colors} border flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
      <p className="font-body text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default Affiliate;
