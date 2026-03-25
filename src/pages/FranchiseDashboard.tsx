import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, IndianRupee, TrendingUp, Copy, Check, 
  ArrowRight, Shield, Clock, Zap, LogOut, 
  QrCode, Download, DollarSign, Wallet, Globe,
  UserPlus, Network, BadgeCheck, ChevronRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import VowzLogo from "@/components/VowzLogo";
import { QRCodeCanvas } from "qrcode.react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FRANCHISE_COMMISSION = {
  IN: { rate: 0.05, base: 999, amount: Math.round(999 * 0.05 * 100) / 100, symbol: "₹" },
  INTL: { rate: 0.05, base: 20, amount: Math.round(20 * 0.05 * 100) / 100, symbol: "$" },
};

const AFFILIATE_COMMISSION = {
  IN: { amount: Math.round(999 * 0.25), symbol: "₹" },
  INTL: { amount: Math.round(20 * 0.25 * 100) / 100, symbol: "$" },
};

type Region = "IN" | "INTL";

export default function FranchiseDashboard() {
  const [user, setUser] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [subAffiliates, setSubAffiliates] = useState<any[]>([]);
  const [franchiseCommissions, setFranchiseCommissions] = useState<any[]>([]);
  const [ownReferrals, setOwnReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>("IN");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [payoutUpi, setPayoutUpi] = useState("");
  const [payoutPaypal, setPayoutPaypal] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadData(session.user.id);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (userId: string) => {
    setLoading(true);

    // Load franchise affiliate record
    const { data: aff } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!aff || !(aff as any).is_franchise || !(aff as any).franchise_approved) {
      setAffiliate(null);
      setLoading(false);
      return;
    }

    setAffiliate(aff);
    setPayoutUpi((aff as any).payout_upi || "");
    setPayoutPaypal((aff as any).payout_paypal || "");

    // Load sub-affiliates
    const { data: subs } = await supabase
      .from("affiliates")
      .select("id, full_name, email, created_at, successful_referrals, total_referrals")
      .eq("franchise_id" as any, aff.id);
    setSubAffiliates(subs || []);

    // Load franchise commissions
    const { data: fc } = await supabase
      .from("franchise_commissions" as any)
      .select("*")
      .eq("franchise_id", aff.id)
      .order("created_at", { ascending: false });
    setFranchiseCommissions(fc || []);

    // Load own referrals
    const { data: refs } = await supabase
      .from("affiliate_referrals")
      .select("*")
      .eq("affiliate_id", aff.id)
      .order("created_at", { ascending: false });
    setOwnReferrals(refs || []);

    setLoading(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied! 📋" });
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = (canvas as HTMLCanvasElement).toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `vowz-franchise-qr-${affiliate.referral_code}.png`;
    link.href = url;
    link.click();
    toast({ title: "QR code downloaded! 📱" });
  };

  const handleSavePayout = async () => {
    if (!affiliate) return;
    setSavingPayout(true);
    const { error } = await supabase
      .from("affiliates")
      .update({ payout_upi: payoutUpi || null, payout_paypal: payoutPaypal || null } as any)
      .eq("id", affiliate.id);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout info saved! ✅" });
    }
    setSavingPayout(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAffiliate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !affiliate) {
    return <Navigate to="/affiliate" replace />;
  }

  const franchiseLink = `https://vowz.me/affiliate?franchise=${affiliate.referral_code}`;
  const ownRefLink = `https://vowz.me/?ref=${affiliate.referral_code}`;

  const totalFranchiseEarnings = franchiseCommissions.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0);
  const totalOwnEarnings = Number(affiliate.total_earnings);
  const totalCombined = totalOwnEarnings + totalFranchiseEarnings;

  const ownConverted = ownReferrals.filter((r) => r.status === "converted").length;
  const fc = FRANCHISE_COMMISSION[region];
  const ac = AFFILIATE_COMMISSION[region];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Franchise Dashboard – Vowz" description="Manage your franchise network and earnings" robots="noindex, nofollow" />

      {/* Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <VowzLogo iconSize="h-6" textSize="text-lg" />
          </Link>
          <span className="text-border mx-2">|</span>
          <span className="font-body text-sm text-muted-foreground flex items-center gap-1.5">
            <Network className="w-4 h-4" /> Franchise Dashboard
          </span>
          <div className="flex-1" />
          <Link to="/affiliate">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
              Affiliate Dashboard
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Dashboard Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full mb-4">
            <Network className="w-3.5 h-3.5" />
            <span className="font-body text-xs font-semibold">Franchise Partner</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Welcome, {affiliate.full_name || "Partner"}!
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-2">
            Manage your network, track sub-affiliate sales, and view all earnings
          </p>

          {/* Region Selector */}
          <div className="flex justify-center mt-4">
            <div className="inline-flex rounded-full border border-border/60 bg-card p-0.5 shadow-sm">
              {([
                { value: "IN" as Region, label: "India", flag: "🇮🇳" },
                { value: "INTL" as Region, label: "International", flag: "🌍" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRegion(opt.value)}
                  className={`px-4 py-1.5 text-xs font-body font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                    region === opt.value
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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={TrendingUp} label="Total Earnings (Combined)" value={`${ac.symbol}${totalCombined.toLocaleString()}`} accent="accent" />
          <StatCard icon={region === "IN" ? IndianRupee : DollarSign} label="Own Affiliate Earnings" value={`${ac.symbol}${totalOwnEarnings.toLocaleString()}`} accent="emerald" />
          <StatCard icon={Network} label="Franchise Override Earnings" value={`${fc.symbol}${totalFranchiseEarnings.toLocaleString()}`} accent="primary" />
          <StatCard icon={UserPlus} label="Sub-Affiliates Onboarded" value={subAffiliates.length} accent="amber" />
        </div>

        {/* Commission Rates */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            Your Commission Structure
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5">
              <p className="font-body text-xs font-semibold text-accent mb-2">💰 Own Affiliate Sales</p>
              <p className="font-display text-xl font-bold text-foreground">25% commission</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ac.symbol}{ac.amount} per premium upgrade from your direct referrals
              </p>
            </div>
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
              <p className="font-body text-xs font-semibold text-primary mb-2">🔗 Sub-Affiliate Override</p>
              <p className="font-display text-xl font-bold text-foreground">5% override commission</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fc.symbol}{fc.amount} per sale by your sub-affiliates (5% of {fc.symbol}{fc.base} original price)
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-body mt-3">
            * Override commission is calculated on the original price, not the discounted amount paid by the customer.
          </p>
        </div>

        {/* Franchise QR Code & Link */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-primary" />
            </div>
            Franchise Recruitment QR & Link
          </h3>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Share this QR code or link to recruit new affiliates. They'll automatically join your franchise network.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col items-center">
              <div ref={qrRef} className="bg-white p-4 rounded-2xl border border-border/30 shadow-sm mb-4">
                <QRCodeCanvas value={franchiseLink} size={180} level="H" includeMargin />
              </div>
              <p className="text-xs text-muted-foreground font-body mb-3 text-center">
                Scan to join as affiliate under your franchise
              </p>
              <Button variant="outline" size="sm" onClick={downloadQR} className="gap-2">
                <Download className="w-4 h-4" /> Download QR
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block">
                  Franchise Recruitment Link
                </label>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                  <code className="font-mono text-xs text-foreground flex-1 truncate select-all">{franchiseLink}</code>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(franchiseLink, "franchise")}>
                    {copiedField === "franchise" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-1">
                  When someone signs up as an affiliate using this link, they become your sub-affiliate automatically.
                </p>
              </div>
              <div>
                <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block">
                  Your Own Referral Link (for customer sales)
                </label>
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 flex items-center gap-3">
                  <code className="font-mono text-xs text-foreground flex-1 truncate select-all">{ownRefLink}</code>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(ownRefLink, "own")}>
                    {copiedField === "own" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Affiliates Table */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border/30">
            <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Sub-Affiliates ({subAffiliates.length})
            </h3>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Affiliates onboarded through your franchise link
            </p>
          </div>

          {subAffiliates.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body text-xs">Name</TableHead>
                    <TableHead className="font-body text-xs">Email</TableHead>
                    <TableHead className="font-body text-xs">Joined</TableHead>
                    <TableHead className="font-body text-xs text-center">Total Sales</TableHead>
                    <TableHead className="font-body text-xs text-right">Your Override Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subAffiliates.map((sub) => {
                    const subOverride = franchiseCommissions
                      .filter((c: any) => c.sub_affiliate_id === sub.id)
                      .reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-body text-sm font-medium">{sub.full_name || "—"}</TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">{sub.email}</TableCell>
                        <TableCell className="font-body text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-body text-xs">
                            {sub.successful_referrals || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-body text-sm font-semibold text-foreground">
                          {fc.symbol}{subOverride.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="font-body text-sm text-muted-foreground mb-1">No sub-affiliates yet</p>
              <p className="font-body text-xs text-muted-foreground/70">
                Share your franchise QR code or link to recruit affiliates under your network.
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
          <p className="text-sm text-muted-foreground font-body mb-4">
            All commissions (affiliate + franchise override) are settled within 48 hours.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-body text-xs font-medium text-foreground mb-1.5 block">🇮🇳 UPI ID / Google Pay</label>
              <Input value={payoutUpi} onChange={(e) => setPayoutUpi(e.target.value)} placeholder="yourname@upi" className="h-10 text-sm" />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-foreground mb-1.5 block">🌍 PayPal Email</label>
              <Input type="email" value={payoutPaypal} onChange={(e) => setPayoutPaypal(e.target.value)} placeholder="you@paypal.com" className="h-10 text-sm" />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSavePayout} disabled={savingPayout}>
            {savingPayout ? "Saving..." : "Save Payout Details"}
          </Button>
        </div>

        {/* Franchise Commission History */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border/30">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Franchise Override Commission History
            </h3>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {franchiseCommissions.length === 0 ? "No franchise commissions earned yet." : `${franchiseCommissions.length} commission(s) earned from sub-affiliate sales`}
            </p>
          </div>
          {franchiseCommissions.length > 0 ? (
            <div className="divide-y divide-border/30">
              {franchiseCommissions.map((c: any) => {
                const sub = subAffiliates.find((s) => s.id === c.sub_affiliate_id);
                return (
                  <div key={c.id} className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      c.payout_status === "paid" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"
                    }`}>
                      {c.payout_status === "paid" ? <Check className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-foreground">
                        Override from {sub?.full_name || sub?.email || "Sub-Affiliate"}
                      </p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">
                        {c.currency === "INR" ? "₹" : "$"}{Number(c.commission_amount).toLocaleString()} • {c.payout_status === "paid" ? "Paid" : "Pending"}
                      </p>
                    </div>
                    <Badge variant={c.payout_status === "paid" ? "default" : "secondary"} className="font-body text-xs shrink-0">
                      {c.payout_status === "paid" ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="font-body text-sm text-muted-foreground">
                Override commissions will appear here when your sub-affiliates make sales.
              </p>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="bg-muted/20 border border-border/30 rounded-2xl p-6 font-body space-y-2">
          <p className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            Franchise Partner Terms
          </p>
          <p className="text-xs text-muted-foreground">• You earn 25% affiliate commission on your own direct sales, same as any affiliate partner.</p>
          <p className="text-xs text-muted-foreground">• You earn an additional 5% override commission on every sale made by your sub-affiliates (calculated on original price).</p>
          <p className="text-xs text-muted-foreground">• India: 5% of ₹999 = ₹{FRANCHISE_COMMISSION.IN.amount} per sub-affiliate sale. International: 5% of $20 = ${FRANCHISE_COMMISSION.INTL.amount} per sub-affiliate sale.</p>
          <p className="text-xs text-muted-foreground">• All commissions are settled within 48 hours via your registered payout method.</p>
          <p className="text-xs text-muted-foreground">• Sub-affiliate details shown are limited to basic info — full customer/website data is not shared.</p>
          <p className="text-xs text-muted-foreground">• Vowz reserves the right to modify franchise terms with 30 days notice.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  const colorMap: Record<string, string> = {
    accent: "text-accent bg-accent/10 border-accent/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    primary: "text-primary bg-primary/10 border-primary/20",
  };
  const colors = colorMap[accent] || colorMap.accent;
  const iconColorMap: Record<string, string> = {
    accent: "text-accent", emerald: "text-emerald-500", amber: "text-amber-500", primary: "text-primary",
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 hover:shadow-card transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${colors} border flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColorMap[accent] || "text-accent"}`} />
      </div>
      <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{value}</p>
      <p className="font-body text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
