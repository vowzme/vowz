import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Users, IndianRupee, TrendingUp, Copy, Check, Gift,
  Link as LinkIcon, Tag, ArrowRight, Shield, Clock, Zap,
  LogOut, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateReferralCode } from "@/hooks/use-affiliate";

const COMMISSION_AMOUNT = 200;

const Affiliate = () => {
  const [user, setUser] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  // Auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customCoupon, setCustomCoupon] = useState("");
  const [savingCoupon, setSavingCoupon] = useState(false);

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
        emailRedirectTo: `${window.location.origin}/affiliate`,
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
    // Check if this user has an affiliate record
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
    const { error } = await supabase.from("affiliates").insert({
      user_id: user.id,
      full_name: fullName || user.user_metadata?.full_name || "",
      email: user.email || email,
      phone: phone || null,
      referral_code: code,
    } as any);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome aboard! 🎉", description: "You're now a ShaadiSite affiliate partner." });
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

  const referralLink = affiliate
    ? `${window.location.origin}/?ref=${affiliate.referral_code}`
    : "";
  const couponLink = affiliate?.custom_coupon
    ? `${window.location.origin}/?coupon=${affiliate.custom_coupon}`
    : "";

  const successfulRefs = referrals.filter((r) => r.status === "converted");
  const pendingRefs = referrals.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-gold" fill="currentColor" />
            <span className="font-display text-lg font-semibold text-foreground">ShaadiSite</span>
          </Link>
          <div className="flex-1" />
          {user && affiliate && (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          )}
        </div>
      </header>

      {/* Hero / Info Section (always visible) */}
      {(!user || !affiliate) && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-2 rounded-full mb-6">
                <Gift className="w-4 h-4" />
                <span className="font-body text-sm font-semibold">Affiliate Partnership Program</span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-foreground mb-4">
                Earn ₹{COMMISSION_AMOUNT} Per Referral
              </h1>
              <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto mb-10">
                Share the joy of beautiful Indian wedding websites and earn commission for every successful premium subscription through your unique referral link.
              </p>
            </motion.div>

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: LinkIcon, title: "Share Your Link", desc: "Get a unique referral link or create a custom coupon code to share with your network." },
                { icon: Users, title: "Friends Sign Up", desc: "When someone signs up using your link — even on the free plan — they're tracked as your referral." },
                { icon: IndianRupee, title: `Earn ₹${COMMISSION_AMOUNT}`, desc: "When your referral upgrades to Premium, you earn ₹200 commission. Even if they upgrade later!" },
              ].map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  className="bg-card border border-border/50 rounded-2xl p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Key benefits */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto mb-12 text-left">
              <h2 className="font-display text-xl font-bold text-foreground mb-4 text-center">Why Partner With Us?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: IndianRupee, text: `₹${COMMISSION_AMOUNT} per successful premium referral` },
                  { icon: Clock, text: "Lifetime attribution — upgrade anytime counts" },
                  { icon: Tag, text: "Create custom coupon codes for your audience" },
                  { icon: TrendingUp, text: "Real-time dashboard to track referrals & earnings" },
                  { icon: Shield, text: "Transparent tracking with detailed reports" },
                  { icon: Zap, text: "Instant referral link — start earning today" },
                ].map((b) => (
                  <div key={b.text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                      <b.icon className="w-4 h-4 text-gold" />
                    </div>
                    <p className="font-body text-sm text-foreground">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Auth / Registration Section */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !user ? (
          /* Sign Up / Sign In */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-card border border-border/50 rounded-2xl p-6 sm:p-8"
          >
            <h2 className="font-display text-xl font-bold text-foreground text-center mb-1">
              {authMode === "signup" ? "Join as Affiliate Partner" : "Affiliate Partner Login"}
            </h2>
            <p className="text-sm text-muted-foreground font-body text-center mb-6">
              {authMode === "signup" ? "Create your account to start earning" : "Sign in to your affiliate dashboard"}
            </p>

            <form onSubmit={authMode === "signup" ? handleSignUp : handleSignIn} className="space-y-4">
              {authMode === "signup" && (
                <>
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1 block">Full Name *</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
                  </div>
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1 block">Phone (optional)</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                </>
              )}
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1 block">Email *</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1 block">Password *</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button variant="gold" className="w-full font-body" disabled={authLoading}>
                {authLoading ? "Please wait..." : authMode === "signup" ? "Create Affiliate Account" : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground font-body mt-4">
              {authMode === "signup" ? "Already a partner?" : "New here?"}{" "}
              <button onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")} className="text-gold hover:underline font-medium">
                {authMode === "signup" ? "Sign In" : "Join as Affiliate"}
              </button>
            </p>
          </motion.div>
        ) : !affiliate ? (
          /* Logged in but not yet registered as affiliate */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-card border border-border/50 rounded-2xl p-6 sm:p-8 text-center"
          >
            <Gift className="w-12 h-12 text-gold mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Complete Registration</h2>
            <p className="text-sm text-muted-foreground font-body mb-6">
              You're signed in as {user.email}. Click below to register as an affiliate partner.
            </p>
            <div className="space-y-3 mb-6 text-left">
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1 block">Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1 block">Phone (optional)</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>
            <Button variant="gold" className="w-full font-body" onClick={handleRegisterAsAffiliate} disabled={authLoading}>
              {authLoading ? "Setting up..." : "Register as Affiliate Partner"}
            </Button>
            <button onClick={handleSignOut} className="text-sm text-muted-foreground hover:text-foreground font-body mt-4 block mx-auto">
              Sign out
            </button>
          </motion.div>
        ) : (
          /* ─── Affiliate Dashboard ─── */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Welcome, {affiliate.full_name || "Partner"}! 🤝
              </h1>
              <p className="text-muted-foreground font-body text-sm mt-1">Your affiliate dashboard</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <DashStat icon={Users} label="Total Referrals" value={affiliate.total_referrals} color="text-gold" />
              <DashStat icon={Check} label="Successful" value={affiliate.successful_referrals} color="text-emerald-500" />
              <DashStat icon={IndianRupee} label="Total Earned" value={`₹${Number(affiliate.total_earnings).toLocaleString()}`} color="text-gold" />
              <DashStat icon={Clock} label="Pending" value={`₹${Number(affiliate.pending_earnings).toLocaleString()}`} color="text-amber-500" />
            </div>

            {/* Referral Link & Coupon */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Referral Link */}
              <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6">
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <LinkIcon className="w-5 h-5 text-gold" /> Your Referral Link
                </h3>
                <div className="bg-muted/30 border border-border/30 rounded-xl p-3 flex items-center gap-2">
                  <code className="font-mono text-xs text-foreground flex-1 truncate">{referralLink}</code>
                  <button
                    onClick={() => copyToClipboard(referralLink, "link")}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "link" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-2">
                  Referral code: <strong className="text-foreground">{affiliate.referral_code}</strong>
                </p>
              </div>

              {/* Custom Coupon */}
              <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6">
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-gold" /> Custom Coupon Code
                </h3>
                {affiliate.custom_coupon ? (
                  <>
                    <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-gold shrink-0" />
                      <code className="font-mono text-sm text-foreground font-bold flex-1 uppercase">{affiliate.custom_coupon}</code>
                      <button
                        onClick={() => copyToClipboard(couponLink, "coupon")}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        {copiedField === "coupon" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body">
                      Coupon link: <code className="text-foreground">{couponLink}</code>
                    </p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-body">Create a memorable coupon code for your audience.</p>
                    <div className="flex gap-2">
                      <Input
                        value={customCoupon}
                        onChange={(e) => setCustomCoupon(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                        placeholder="e.g. meera-wedding"
                        className="font-mono text-sm"
                        maxLength={30}
                      />
                      <Button variant="gold" size="sm" onClick={handleSaveCoupon} disabled={savingCoupon || customCoupon.length < 3}>
                        {savingCoupon ? "..." : "Save"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body">
                      Lowercase letters, numbers, hyphens and underscores only. Min 3 chars.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Referral History */}
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border/30">
                <h3 className="font-display text-lg font-semibold text-foreground">Referral History</h3>
                <p className="text-sm text-muted-foreground font-body mt-0.5">
                  {referrals.length === 0
                    ? "No referrals yet. Share your link to start earning!"
                    : `${referrals.length} referral${referrals.length > 1 ? "s" : ""} tracked`}
                </p>
              </div>

              {referrals.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        ref.status === "converted" ? "bg-emerald-500/10" : "bg-amber-500/10"
                      }`}>
                        {ref.status === "converted" ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-foreground truncate">
                          {ref.referred_email || "User"}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          {ref.status === "converted"
                            ? `Upgraded to ${ref.plan} • ₹${Number(ref.commission_amount).toLocaleString()} earned`
                            : `Signed up on ${ref.plan} plan • Pending conversion`}
                        </p>
                      </div>
                      <span className="font-body text-xs text-muted-foreground shrink-0">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="font-body text-sm text-muted-foreground">
                    Share your referral link and referrals will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="bg-muted/30 border border-border/30 rounded-xl p-4 text-xs text-muted-foreground font-body space-y-1">
              <p className="font-semibold text-foreground text-sm mb-2">Affiliate Program Terms</p>
              <p>• You earn ₹{COMMISSION_AMOUNT} for every referred user who subscribes to Premium (₹9.99/month or ₹99/6 months).</p>
              <p>• If a referred user signs up on the free plan and later upgrades, you still earn the commission.</p>
              <p>• Commissions are tracked in real-time and paid out monthly to your registered payment method.</p>
              <p>• Self-referrals, fraudulent signups, or abuse of the program will result in account termination.</p>
              <p>• ShaadiSite reserves the right to modify commission rates with 30 days notice.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

function DashStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="font-body text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default Affiliate;
