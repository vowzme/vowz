import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Edit3, Eye, ExternalLink, Globe, GlobeLock,
  Users, Calendar, Mail, ChevronDown, ChevronUp,
  Settings, LogOut, Sparkles, Plus, Check, X, Copy,
  User, MapPin, Utensils, PartyPopper, Clock, Trash2,
  BarChart3, TrendingUp, MousePointer, MessageSquare,
  ClipboardList, CalendarDays, Search, Crown, ShieldCheck, ExternalLink as ExternalLinkIcon,
  IndianRupee, BookOpen, Receipt, Download, Heart as HeartIcon,
  Pause, Play, QrCode, Music2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useWeddingSite } from "@/hooks/use-wedding-site";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import VowzLogo from "@/components/VowzLogo";
import { useSiteAnalytics } from "@/hooks/use-analytics";
import { useWeddingChecklist } from "@/hooks/use-wedding-checklist";
import BudgetTracker from "@/components/BudgetTracker";
import SEOHead from "@/components/SEOHead";
import GettingStartedGuide from "@/components/GettingStartedGuide";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import CustomSlugEditor from "@/components/CustomSlugEditor";
import PremiumUpgradeButton from "@/components/PremiumUpgradeButton";
import FreePlanCountdown from "@/components/FreePlanCountdown";
import StorageUsageCard from "@/components/StorageUsageCard";
import StorageBreakdownCard from "@/components/StorageBreakdownCard";
import StorageQuotaBanner from "@/components/StorageQuotaBanner";
import FeatureSuggestionDialog from "@/components/FeatureSuggestionDialog";
import { usePricingRegion, formatPrice } from "@/hooks/use-pricing-region";
import DashboardTour from "@/components/DashboardTour";
import DashboardMusicCard from "@/components/DashboardMusicCard";
import HelpTip from "@/components/HelpTip";
import { subscribeWithLogging } from "@/lib/realtime-logger";
import { validateVideoUrl } from "@/lib/video-embed";

// Walk a wedding site's sections and return any video URLs that fail validation.
function collectVideoProblems(sections: any): { where: string; error: string; hint?: string }[] {
  if (!Array.isArray(sections)) return [];
  const out: { where: string; error: string; hint?: string }[] = [];
  sections.forEach((s: any, idx: number) => {
    if (!s) return;
    const check = (url: string, where: string) => {
      if (!url) return;
      const v = validateVideoUrl(url) as { ok: boolean; error?: string; hint?: string };
      if (!v.ok) out.push({ where, error: v.error || "Invalid URL", hint: v.hint });
    };
    if (s.type === "video" && Array.isArray(s.data?.videos)) {
      s.data.videos.forEach((v: any, i: number) => check(v?.url, `Video section #${idx + 1}, item ${i + 1}`));
    }
    if (s.type === "livestream") check(s.data?.embedUrl, `Live stream (section #${idx + 1})`);
  });
  return out;
}
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RsvpRow {
  id: string;
  guest_name: string;
  guest_email: string;
  attending: boolean;
  guest_count: number;
  meal_preference: string | null;
  selected_events: string[];
  message: string | null;
  created_at: string;
}

// ─── PDF Invoice Generator ───────────────────────────────────────────
function generateInvoicePDF(payment: any, profile: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Brand header
  doc.setFillColor(107, 29, 42); // brand maroon
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 245, 230);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Vowz", 20, 25);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Wedding Websites", 20, 33);

  // Invoice title
  doc.setTextColor(107, 29, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });

  // Invoice details
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const invoiceDate = payment.started_at || payment.created_at;
  const invoiceNo = payment.payment_order_id || payment.id?.slice(0, 12) || "N/A";
  doc.text(`Invoice No: ${invoiceNo}`, pageWidth - 20, 55, { align: "right" });
  doc.text(`Date: ${invoiceDate ? format(new Date(invoiceDate), "dd MMM yyyy") : "N/A"}`, pageWidth - 20, 62, { align: "right" });
  doc.text(`Payment ID: ${payment.payment_id || "N/A"}`, pageWidth - 20, 69, { align: "right" });

  // Bill To
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(profile?.full_name || "Customer", 20, 63);
  doc.text(profile?.email || "", 20, 70);

  // Divider
  doc.setDrawColor(212, 168, 83); // gold
  doc.setLineWidth(0.5);
  doc.line(20, 80, pageWidth - 20, 80);

  // Table header
  const tableY = 90;
  doc.setFillColor(245, 240, 230);
  doc.rect(20, tableY - 5, pageWidth - 40, 12, "F");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 25, tableY + 2);
  doc.text("Period", 100, tableY + 2);
  doc.text("Amount", pageWidth - 25, tableY + 2, { align: "right" });

  // Table row
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const rowY = tableY + 16;
  const planName = (payment.plan || "premium_yearly").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  doc.text(`Vowz ${planName}`, 25, rowY);
  const startDate = payment.started_at ? format(new Date(payment.started_at), "dd MMM yyyy") : "—";
  const endDate = payment.expires_at ? format(new Date(payment.expires_at), "dd MMM yyyy") : "—";
  doc.text(`${startDate} – ${endDate}`, 100, rowY);
  const amount = payment.amount_paid > 0 ? `₹${Number(payment.amount_paid).toLocaleString("en-IN")}` : "—";
  doc.setFont("helvetica", "bold");
  doc.text(amount, pageWidth - 25, rowY, { align: "right" });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, rowY + 8, pageWidth - 20, rowY + 8);

  // Total
  const totalY = rowY + 20;
  doc.setFontSize(11);
  doc.setTextColor(107, 29, 42);
  doc.text("Total:", pageWidth - 65, totalY);
  doc.text(amount, pageWidth - 25, totalY, { align: "right" });

  // Status badge
  doc.setFontSize(9);
  doc.setTextColor(45, 80, 22);
  doc.text(`Status: ${(payment.status || "").toUpperCase()}`, 20, totalY);

  // Footer
  const footerY = 260;
  doc.setDrawColor(212, 168, 83);
  doc.setLineWidth(0.3);
  doc.line(20, footerY, pageWidth - 20, footerY);
  doc.setTextColor(140, 140, 140);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for choosing Vowz Premium!", pageWidth / 2, footerY + 8, { align: "center" });
  doc.text("vowz.me | support@vowz.me", pageWidth / 2, footerY + 14, { align: "center" });
  doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, footerY + 20, { align: "center" });

  doc.save(`Vowz-Invoice-${invoiceNo}.pdf`);
}

// Shown when the user picked a template from /card-gallery and landed back here.
function PendingCardTemplateBanner() {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    try { setSlug(sessionStorage.getItem("pendingCardTemplate")); } catch {}
  }, []);
  if (!slug) return null;
  return (
    <div className="mb-6 rounded-2xl border border-gold/40 bg-gold/5 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="bg-gold/20 rounded-full p-2 shrink-0">
        <Sparkles className="w-5 h-5 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-sm sm:text-base font-bold">Template ready to apply</h3>
        <p className="font-body text-xs sm:text-sm text-muted-foreground">
          Open any site's <span className="font-medium">Invitation Card</span> below and "{slug}" will load automatically.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => { try { sessionStorage.removeItem("pendingCardTemplate"); } catch {}; setSlug(null); }}
      >
        Dismiss
      </Button>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { loadUserSite, updateSite, saving } = useWeddingSite();
  const { pricing } = usePricingRegion();
  const [site, setSite] = useState<any>(null);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const headerQrRef = useRef<HTMLDivElement>(null);

  const handleDownloadHeaderQR = () => {
    const svg = headerQrRef.current?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 1024, 1024);
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const a = document.createElement("a");
      a.download = `${(site?.slug || "wedding")}-qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast({ title: "QR downloaded 📥" });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [blessings, setBlessings] = useState<any[]>([]);
  const [blessingsLoading, setBlessingsLoading] = useState(false);


  // Load site, profile and subscription status
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const loadProfile = async (retries = 3): Promise<any> => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) return data;
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
        return loadProfile(retries - 1);
      }
      return null;
    };

    const loadSubscription = async () => {
      const { data } = await supabase
        .from("user_subscriptions" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const allSubs = (data as any[]) || [];

      const activeSub = allSubs.find(
        (s: any) => s.status === "active" && (!s.expires_at || new Date(s.expires_at).getTime() > Date.now())
      );

      return { activeSub: activeSub || null, allSubs };
    };

    Promise.all([loadUserSite(), loadProfile(), loadSubscription()]).then(([siteData, profile, subResult]) => {
      setSite(siteData);
      setProfileData(profile);
      setSubscription(subResult.activeSub);
      setPaymentHistory(subResult.allSubs);
      setLoading(false);
      if (siteData) {
        loadRsvps(siteData.id);
        loadBlessings(siteData.id);
      } else {
        // First-time user: auto-redirect to wizard
        const isNewUser = profile?.created_at &&
          (Date.now() - new Date(profile.created_at).getTime()) < 5 * 60 * 1000; // within 5 minutes of account creation
        if (isNewUser) {
          navigate("/wizard", { replace: true });
        }
      }
    });
  }, [user]);

  // ─── Real-time RSVP subscription ───────────────────────────────────
  useEffect(() => {
    if (!site?.id) return;
    const suffix = Math.random().toString(36).slice(2, 10);
    const channelName = `rsvps-${site.id}-${suffix}`;
    const channel = subscribeWithLogging(
      supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "rsvps", filter: `wedding_site_id=eq.${site.id}` },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setRsvps((prev) => [payload.new as RsvpRow, ...prev]);
              toast({ title: "New RSVP received! 🎉", description: `${(payload.new as any).guest_name} just responded.` });
            } else if (payload.eventType === "DELETE") {
              setRsvps((prev) => prev.filter((r) => r.id !== (payload.old as any).id));
            } else if (payload.eventType === "UPDATE") {
              setRsvps((prev) => prev.map((r) => r.id === (payload.new as any).id ? (payload.new as RsvpRow) : r));
            }
          }
        ),
      { channel: channelName, callback: "rsvps:*", extra: { siteId: site.id } },
    );
    return () => { supabase.removeChannel(channel); };
  }, [site?.id]);

  const loadBlessings = async (siteId: string) => {
    setBlessingsLoading(true);
    const { data } = await supabase
      .from("guest_blessings" as any)
      .select("*")
      .eq("wedding_site_id", siteId)
      .order("created_at", { ascending: false });
    if (data) setBlessings(data as any);
    setBlessingsLoading(false);
  };

  const handleBlessingAction = async (id: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("guest_blessings" as any)
      .update({ status: action } as any)
      .eq("id", id);
    if (!error) {
      setBlessings((prev) => prev.map((b) => b.id === id ? { ...b, status: action } : b));
      toast({ title: action === "approved" ? "Blessing approved ✅" : "Blessing rejected" });
    }
  };

  const handleBlessingReply = async (id: string, reply: string) => {
    const { error } = await supabase
      .from("guest_blessings" as any)
      .update({ owner_reply: reply } as any)
      .eq("id", id);
    if (!error) {
      setBlessings((prev) => prev.map((b) => b.id === id ? { ...b, owner_reply: reply } : b));
      toast({ title: "Reply saved 💕" });
    }
  };

  const handleDeleteBlessing = async (id: string) => {
    const { error } = await supabase.from("guest_blessings" as any).delete().eq("id", id);
    if (!error) {
      setBlessings((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "Blessing removed" });
    }
  };

  const loadRsvps = async (siteId: string) => {
    setRsvpLoading(true);
    const { data, error } = await supabase
      .from("rsvps")
      .select("*")
      .eq("wedding_site_id", siteId)
      .order("created_at", { ascending: false });
    if (!error && data) setRsvps(data as any);
    setRsvpLoading(false);
  };

  const handleTogglePublish = async () => {
    if (!site) return;
    if (!site.is_published) {
      // Block publish when any video URL in the site is broken/unsupported.
      const problems = collectVideoProblems((site as any).sections);
      if (problems.length > 0) {
        const first = problems[0];
        toast({
          title: "Fix video links before publishing",
          description: `${first.where}: ${first.error}${first.hint ? " — " + first.hint : ""}`,
          variant: "destructive",
        });
        return;
      }
      setPublishConfirmOpen(true);
      return;
    }
    await doTogglePublish(false);
  };

  const doTogglePublish = async (newStatus: boolean) => {
    if (!site) return;
    const success = await updateSite(site.id, { is_published: newStatus });
    if (success) {
      setSite({ ...site, is_published: newStatus });
      toast({
        title: newStatus ? "Site published! 🎉" : "Site unpublished",
        description: newStatus
          ? "Your wedding site is now live!"
          : "Your site is no longer publicly accessible.",
      });
      if (newStatus && site.slug) {
        window.open(`/site/${site.slug}`, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleDeleteRsvp = async (rsvpId: string) => {
    const { error } = await supabase.from("rsvps").delete().eq("id", rsvpId);
    if (!error) {
      setRsvps((prev) => prev.filter((r) => r.id !== rsvpId));
      toast({ title: "RSVP removed" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const copyLink = () => {
    if (!site?.slug) return;
    const url = `${window.location.origin}/site/${site.slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied! 📋" });
  };

  const handleUpdateProfile = async (field: string, value: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value } as any)
      .eq("id", user.id);
    if (!error) {
      setProfileData({ ...profileData, [field]: value });
      toast({ title: "Profile updated" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isVerified = profileData?.email_verified === true;
  const isPremium = Boolean(subscription);
  const attendingCount = rsvps.filter((r) => r.attending).length;
  const totalGuests = rsvps.filter((r) => r.attending).reduce((sum, r) => sum + r.guest_count, 0);

  return (
    <div className="min-h-dvh bg-background">
      <SEOHead title="Dashboard – Vowz" description="Manage your wedding website, RSVPs, and settings." robots="noindex, nofollow" />
      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-3">
          <Link to="/" className="flex items-center shrink-0" aria-label="Vowz home">
            <VowzLogo iconSize="h-6" textSize="text-lg" />
          </Link>
          <div className="flex-1" />
          <DashboardTour />
          <FeatureSuggestionDialog />
          <Button variant="outline" size="sm" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5 sm:py-8">
        {/* Email Verification Banner */}
        {profileData && !profileData.email_verified && (
          <EmailVerifyBanner
            userEmail={user?.email || ""}
            onVerified={() => setProfileData({ ...profileData, email_verified: true })}
          />
        )}

        {/* Welcome */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-tour="welcome">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Welcome{profileData?.full_name ? `, ${profileData.full_name}` : ""}! 💍
            </h1>
            <p className="text-muted-foreground font-body mt-1 text-sm sm:text-base">
              Manage your wedding site, view RSVPs, and customize settings.
            </p>
          </div>
          {site && site.slug && (
            <div className="flex flex-wrap gap-2 shrink-0">
              <div
                className="flex items-center gap-2 px-3 rounded-md border border-border/50 bg-card/50 text-xs font-body"
                aria-live="polite"
              >
                <span
                  className={`w-2 h-2 rounded-full ${site.is_published ? "bg-emerald-500" : "bg-muted-foreground"}`}
                />
                <span className="font-medium text-foreground">
                  {site.is_published ? "Published" : "Draft"}
                </span>
                {(site as any).updated_at && (
                  <span className="text-muted-foreground hidden sm:inline">
                    · Updated {format(new Date((site as any).updated_at), "MMM d, h:mm a")}
                  </span>
                )}
              </div>
              <Button
                variant={site.is_published ? "outline" : "gold"}
                size="sm"
                onClick={handleTogglePublish}
                disabled={saving}
                aria-label={site.is_published ? "Unpublish site" : "Publish site"}
              >
                {site.is_published ? (
                  <><GlobeLock className="w-4 h-4 mr-1" /> Unpublish</>
                ) : (
                  <><Globe className="w-4 h-4 mr-1" /> Publish</>
                )}
              </Button>
              <Button variant="outline" size="sm" asChild aria-label="Preview site in a new tab">
                <a href={`/site/${site.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" /> Preview Site
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadHeaderQR}
                aria-label="Download QR code as PNG"
              >
                <QrCode className="w-4 h-4 mr-1" /> Download QR
              </Button>
              <div ref={headerQrRef} className="hidden" aria-hidden="true">
                <QRCodeSVG
                  value={`${window.location.origin}/site/${site.slug}`}
                  size={512}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#001F3F"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pending invitation-card template chosen from the public gallery */}
        <PendingCardTemplateBanner />

        {/* Premium Status / Upgrade Banner */}
        {isPremium ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4"
          >
            <div className="bg-gold/20 rounded-full p-2 shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm sm:text-base font-bold text-foreground">Premium Active</h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground truncate">
                Your Premium plan is active{subscription?.expires_at ? ` until ${new Date(subscription.expires_at).toLocaleDateString()}` : ""}.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="bg-gold/20 rounded-full p-2 shrink-0">
                <Crown className="w-5 h-5 text-gold" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-sm sm:text-base font-bold text-foreground">Upgrade to Premium</h3>
                <p className="font-body text-xs sm:text-sm text-muted-foreground truncate">
                  AI editor, 5GB storage, no watermarks & more
                </p>
              </div>
            </div>
            <PremiumUpgradeButton
              variant="gold"
              size="sm"
              className="shrink-0 w-full sm:w-auto"
              label={`${formatPrice(pricing, "premium")}/yr`}
              onUpgraded={() => setSubscription({ status: "active", expires_at: null })}
            />
          </motion.div>
        )}

        {/* Storage Usage */}
        <StorageQuotaBanner />
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <StorageUsageCard />
          <StorageBreakdownCard />
        </div>

        <div className="mb-6">
          <Link
            to="/dashboard/widgets"
            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/40 transition-colors"
          >
            <div>
              <div className="font-display font-semibold text-foreground">App Widgets & Capabilities</div>
              <div className="text-sm text-muted-foreground">Toggle push, background sync, offline, countdown widget and more.</div>
            </div>
            <span className="text-sm text-primary font-medium">Configure →</span>
          </Link>
        </div>

        {!site ? (
          /* No site yet */
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-8 sm:p-12 text-center"
            >
              <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Create Your Wedding Site
              </h2>
              <p className="text-muted-foreground font-body mb-6 max-w-md mx-auto">
                Our step-by-step wizard will help you build a beautiful wedding website in minutes.
              </p>
              <Button variant="gold" size="lg" asChild>
                <Link to="/wizard">
                  <Sparkles className="w-4 h-4 mr-2" /> Start Wedding Wizard
                </Link>
              </Button>
            </motion.div>
            <div className="mt-8">
              <GettingStartedGuide />
            </div>
          </>
        ) : (
          /* Has site */
          <>
            {!isPremium && profileData?.created_at && (
              <FreePlanCountdown
                siteCreatedAt={profileData.created_at}
                onUpgraded={() => setSubscription({ status: "active", expires_at: null })}
              />
            )}
          <Tabs defaultValue="overview" className="space-y-6">
            {/* Mobile: 2-row grid tabs */}
            <TabsList data-tour="tabs" className="bg-card border border-border/50 w-full h-auto flex-wrap gap-1 p-1.5 sm:p-1 sm:flex-nowrap sm:gap-0 sm:h-10 justify-center">
              <TabsTrigger value="overview" data-tour="tab-overview" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">Overview</TabsTrigger>
              <TabsTrigger value="guide" data-tour="tab-guide" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">
                Guide <BookOpen className="w-3 h-3 ml-0.5 hidden sm:inline" />
              </TabsTrigger>
              <TabsTrigger value="budget" data-tour="tab-budget" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">
                Budget <IndianRupee className="w-3 h-3 ml-0.5 hidden sm:inline" />
              </TabsTrigger>
              <TabsTrigger value="checklist" data-tour="tab-checklist" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">
                Checklist <ClipboardList className="w-3 h-3 ml-0.5 hidden sm:inline" />
              </TabsTrigger>
              <TabsTrigger value="analytics" data-tour="tab-analytics" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">
                Analytics <BarChart3 className="w-3 h-3 ml-0.5 hidden sm:inline" />
              </TabsTrigger>
              <TabsTrigger value="rsvps" data-tour="tab-rsvps" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">
                Guest List {rsvps.length > 0 && <span className="ml-0.5 sm:ml-1.5 bg-gold/20 text-gold text-[9px] sm:text-xs px-1 py-0.5 rounded-full">{rsvps.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="blessings" data-tour="tab-blessings" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">
                Blessings {blessings.length > 0 && <span className="ml-0.5 sm:ml-1.5 bg-gold/20 text-gold text-[9px] sm:text-xs px-1 py-0.5 rounded-full">{blessings.filter(b => b.status === "pending").length || blessings.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="billing" data-tour="tab-billing" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">
                Billing <Receipt className="w-3 h-3 ml-0.5 hidden sm:inline" />
              </TabsTrigger>
              <TabsTrigger value="music" data-tour="tab-music" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">
                Music <Music2 className="w-3 h-3 ml-0.5 hidden sm:inline" />
              </TabsTrigger>
              <TabsTrigger value="settings" data-tour="tab-settings" className="font-body text-[11px] sm:text-sm flex-1 sm:flex-initial min-w-[calc(33%-4px)] sm:min-w-0">Settings</TabsTrigger>
            </TabsList>

            {/* ─── Overview Tab ─── */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Site card */}
                <div data-tour="site-card" className="lg:col-span-2 bg-card border border-border/50 rounded-2xl overflow-hidden">
                  {/* Mini hero preview */}
                  <div
                    className="relative py-12 px-6 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${(site.suggested_colors as any)?.[0] || "#6B1D2A"}, ${(site.suggested_colors as any)?.[0] || "#6B1D2A"}dd)`,
                    }}
                  >
                    <Heart className="w-6 h-6 mx-auto mb-2" style={{ color: (site.suggested_colors as any)?.[1] || "#D4A853" }} fill="currentColor" />
                    <h2 className="font-display text-2xl font-bold" style={{ color: (site.suggested_colors as any)?.[2] || "#FFF5E6" }}>
                      {site.partner1} & {site.partner2}
                    </h2>
                    <p className="font-display text-sm italic mt-1" style={{ color: (site.suggested_colors as any)?.[1] || "#D4A853" }}>
                      {site.tagline}
                    </p>
                  </div>

                  <div className="p-4 sm:p-6 flex flex-wrap gap-2 sm:gap-3 [&_button]:min-h-11 [&_a]:min-h-11">
                    <Button variant="gold" size="sm" asChild>
                      <Link to="/editor">
                        <Edit3 className="w-4 h-4 mr-1" /> Edit Site
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild aria-label="Open the wedding wizard to review or fill missing details">
                      <Link to="/wizard?resume=1">
                        <Sparkles className="w-4 h-4 mr-1" /> Wedding Wizard
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTogglePublish}
                      disabled={saving}
                      data-tour="publish"
                      aria-label={site.is_published ? "Unpublish site" : "Publish site"}
                    >
                      {site.is_published ? (
                        <><GlobeLock className="w-4 h-4 mr-1" /> Unpublish</>
                      ) : (
                        <><Globe className="w-4 h-4 mr-1" /> Publish</>
                      )}
                    </Button>
                    {/* Pause / Reactivate */}
                    {site.is_published && (site as any).status !== "paused" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await supabase.from("wedding_sites").update({ status: "paused", is_published: false } as any).eq("id", site.id);
                          setSite({ ...site, status: "paused", is_published: false });
                          toast({ title: "Site paused ⏸️", description: "Visitors will see a 'temporarily paused' message." });
                        }}
                      >
                        <Pause className="w-4 h-4 mr-1" /> Pause Site
                      </Button>
                    ) : (site as any).status === "paused" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await supabase.from("wedding_sites").update({ status: "active", is_published: true } as any).eq("id", site.id);
                          setSite({ ...site, status: "active", is_published: true });
                          toast({ title: "Site reactivated! 🎉" });
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" /> Reactivate
                      </Button>
                    )}
                    {/* Delete site */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        if (!confirm("Permanently delete your wedding site? This cannot be undone.")) return;
                        const { error } = await supabase.from("wedding_sites").delete().eq("id", site.id);
                        if (!error) {
                          setSite(null);
                          toast({ title: "Site deleted", description: "Your slug is now available for others." });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete Site
                    </Button>
                    {site.is_published && site.slug && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/site/${site.slug}`} target="_blank" rel="noopener">
                            <ExternalLink className="w-4 h-4 mr-1" /> View Live
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyLink}>
                          <Copy className="w-4 h-4 mr-1" /> Copy Link
                        </Button>
                      </>
                    )}
                    <Button variant="gold" size="sm" asChild>
                      <Link to={`/invitation-card/${site.id}`}>
                        <Download className="w-4 h-4 mr-1" /> Invitation Card
                      </Link>
                    </Button>
                  </div>
                  {site.is_published && site.slug && (
                    <div className="mt-4 border-t border-border/30 pt-4">
                      <QRCodeGenerator
                        url={`${window.location.origin}/site/${site.slug}`}
                        coupleNames={`${site.partner1}-${site.partner2}`}
                        isPremium={isPremium}
                        accent={(site.suggested_colors as any)?.[1] || "#D4A853"}
                      />
                    </div>
                  )}
                </div>

                {/* Custom URL Editor */}
                {site.slug && (
                  <div className="lg:col-span-2">
                    <CustomSlugEditor
                      siteId={site.id}
                      currentSlug={site.slug}
                      partner1={site.partner1}
                      partner2={site.partner2}
                      weddingDate={profileData?.wedding_date}
                      isPremium={isPremium}
                      onSlugSaved={(newSlug) => setSite({ ...site, slug: newSlug })}
                    />
                  </div>
                )}

                {/* Background Music — surfaced on Overview for visibility */}
                <div className="lg:col-span-3" data-tour="overview-music">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Music2 className="w-4 h-4 text-gold" />
                    <h3 className="font-display text-lg font-semibold text-foreground">Background Music</h3>
                    <span className="ml-auto text-[10px] font-body uppercase tracking-wider bg-gold/15 text-gold px-2 py-0.5 rounded-full">New</span>
                  </div>
                  <DashboardMusicCard site={site} onUpdate={(next) => setSite(next)} />
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                  <StatCard
                    icon={Users}
                    label="Total RSVPs"
                    value={rsvps.length}
                    accent={(site.suggested_colors as any)?.[1] || "#D4A853"}
                  />
                  <StatCard
                    icon={Check}
                    label="Attending"
                    value={`${attendingCount} (${totalGuests} guests)`}
                    accent="#2D5016"
                  />
                  <StatCard
                    icon={X}
                    label="Declined"
                    value={rsvps.filter((r) => !r.attending).length}
                    accent="#8B3A4A"
                  />
                  <div className="bg-card border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-body text-sm text-muted-foreground">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${site.is_published ? "bg-emerald" : "bg-muted-foreground"}`} />
                      <span className="font-body text-sm font-medium text-foreground">
                        {site.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ─── Guide Tab ─── */}
            <TabsContent value="guide">
              <GettingStartedGuide />
            </TabsContent>

            {/* ─── Budget Tab ─── */}
            <TabsContent value="budget">
              <BudgetTracker siteId={site?.id} />
            </TabsContent>

            {/* ─── Checklist Tab ─── */}
            <TabsContent value="checklist">
              <ChecklistPanel siteId={site?.id} accent={(site.suggested_colors as any)?.[1] || "#D4A853"} />
            </TabsContent>

            {/* ─── Analytics Tab ─── */}
            <TabsContent value="analytics">
              <AnalyticsPanel siteId={site?.id} accent={(site.suggested_colors as any)?.[1] || "#D4A853"} />
            </TabsContent>

            {/* ─── RSVPs / Guest List Tab ─── */}
            <TabsContent value="rsvps">
              <RsvpReminderCard site={site} />
              <GuestListPanel rsvps={rsvps} rsvpLoading={rsvpLoading} onDelete={handleDeleteRsvp} site={site} copyLink={copyLink} />
            </TabsContent>

            {/* ─── Billing Tab ─── */}
            <TabsContent value="billing">
              <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">Billing & Payments</h2>
                    <p className="font-body text-sm text-muted-foreground mt-1">
                      {isPremium ? "Your Premium plan is active." : "You're on the Free plan."}
                    </p>
                  </div>
                  {!isPremium && (
                    <PremiumUpgradeButton
                      variant="gold"
                      size="sm"
                      label="Upgrade"
                      onUpgraded={() => {
                        setSubscription({ status: "active", expires_at: null });
                        // Reload payment history
                        supabase
                          .from("user_subscriptions" as any)
                          .select("*")
                          .eq("user_id", user!.id)
                          .order("created_at", { ascending: false })
                          .then(({ data }) => setPaymentHistory((data as any[]) || []));
                      }}
                    />
                  )}
                </div>

                {paymentHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-body text-sm text-muted-foreground">No payment history yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4">Order ID</th>
                          <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4">Plan</th>
                          <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4">Amount</th>
                          <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4">Status</th>
                          <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4">Date</th>
                          <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4">Expires</th>
                          <th className="font-body text-xs text-muted-foreground font-medium pb-3">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((p: any) => (
                          <tr key={p.id} className="border-b border-border/30 last:border-0">
                            <td className="font-body text-xs text-foreground py-3 pr-4">
                              <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
                                {p.payment_order_id ? p.payment_order_id.slice(-12) : "—"}
                              </code>
                            </td>
                            <td className="font-body text-xs text-foreground py-3 pr-4 capitalize">
                              {(p.plan || "").replace(/_/g, " ")}
                            </td>
                            <td className="font-display text-sm font-semibold text-foreground py-3 pr-4">
                              {p.amount_paid > 0 ? `₹${Number(p.amount_paid).toLocaleString("en-IN")}` : "—"}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-semibold ${
                                  p.status === "active"
                                    ? "bg-emerald/15 text-emerald"
                                    : p.status === "pending"
                                    ? "bg-gold/15 text-gold"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="font-body text-xs text-muted-foreground py-3 pr-4">
                              {p.started_at ? format(new Date(p.started_at), "dd MMM yyyy") : p.created_at ? format(new Date(p.created_at), "dd MMM yyyy") : "—"}
                            </td>
                            <td className="font-body text-xs text-muted-foreground py-3 pr-4">
                              {p.expires_at ? format(new Date(p.expires_at), "dd MMM yyyy") : "—"}
                            </td>
                            <td className="py-3">
                              {p.status === "active" && p.amount_paid > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] gap-1"
                                  onClick={() => generateInvoicePDF(p, profileData)}
                                >
                                  <Download className="w-3 h-3" /> PDF
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ─── Blessings Tab ─── */}
            <TabsContent value="blessings">
              <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <HeartIcon className="w-5 h-5 text-gold" fill="currentColor" /> Guest Blessings
                  </h3>
                  <span className="text-xs font-body text-muted-foreground">
                    {blessings.filter(b => b.status === "pending").length} pending · {blessings.filter(b => b.status === "approved").length} approved
                  </span>
                </div>

                {blessingsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : blessings.length === 0 ? (
                  <div className="text-center py-12">
                    <HeartIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-body text-muted-foreground text-sm">No guest blessings yet.</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">Add a "Blessings Wall" section in the editor to start receiving messages.</p>
                  </div>
                ) : (
                  <div role="list" aria-label={`${blessings.length} guest blessing${blessings.length === 1 ? "" : "s"}`} className="space-y-3">
                    {blessings.map((blessing) => (
                      <BlessingModerationCard
                        key={blessing.id}
                        blessing={blessing}
                        onApprove={() => handleBlessingAction(blessing.id, "approved")}
                        onReject={() => handleBlessingAction(blessing.id, "rejected")}
                        onReply={(reply) => handleBlessingReply(blessing.id, reply)}
                        onDelete={() => handleDeleteBlessing(blessing.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ─── Music Tab ─── */}
            <TabsContent value="music">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-start gap-3 bg-gold/5 border border-gold/20 rounded-2xl p-4">
                  <Music2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">Background Music</h2>
                    <p className="font-body text-sm text-muted-foreground mt-1">
                      Set the mood for your wedding site. Pick a track from the curated library or upload your own — visitors can play or mute it from the site.
                    </p>
                  </div>
                </div>
                <DashboardMusicCard site={site} onUpdate={(next) => setSite(next)} />
              </div>
            </TabsContent>

            {/* ─── Settings Tab ─── */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Profile settings */}
                <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-1.5">
                    Profile
                  </h2>
                  <div className="space-y-4">
                    <EditableField
                      label="Full Name"
                      value={profileData?.full_name || ""}
                      onSave={(v) => handleUpdateProfile("full_name", v)}
                      icon={User}
                    />
                    <EditableField
                      label="Partner's Name"
                      value={profileData?.partner_name || ""}
                      onSave={(v) => handleUpdateProfile("partner_name", v)}
                      icon={Users}
                    />
                    <EditableField
                      label="Wedding Location"
                      value={profileData?.wedding_location || ""}
                      onSave={(v) => handleUpdateProfile("wedding_location", v)}
                      icon={MapPin}
                    />
                    <div>
                      <label className="font-body text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                        <Mail className="w-3.5 h-3.5" /> Email
                      </label>
                      <p className="font-body text-sm text-foreground">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Site settings */}
                <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4">Site Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-1 block">Theme</label>
                      <p className="font-body text-sm text-foreground capitalize">{site.theme}</p>
                    </div>
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-1 block">Cultural Background</label>
                      <p className="font-body text-sm text-foreground">{site.cultural_background}</p>
                    </div>
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-1 block">Colors</label>
                      <div className="flex gap-2">
                        {((site.suggested_colors as any) || []).map((c: string, i: number) => (
                          <div key={i} className="w-8 h-8 rounded-full border border-border/50" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-1 block">Site URL</label>
                      {site.slug ? (
                        <div className="flex items-center gap-2">
                          <code className="font-body text-xs text-foreground bg-muted px-2 py-1 rounded">
                            /site/{site.slug}
                          </code>
                          <button
                            onClick={copyLink}
                            aria-label="Copy site link"
                            className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="font-body text-sm text-muted-foreground">Generated on publish</p>
                      )}
                    </div>
                    <div className="pt-2">
                      <Button variant="gold" size="sm" asChild>
                        <Link to="/editor">
                          <Edit3 className="w-4 h-4 mr-1" /> Open Editor
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="ml-2">
                        <Link to={`/dashboard/guests/${site.id}`}>
                          <Users className="w-4 h-4 mr-1" /> Guest List
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

            </TabsContent>
          </Tabs>
          </>
        )}
      </div>
      <AlertDialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish your wedding site?</AlertDialogTitle>
            <AlertDialogDescription>
              Your site will become <strong>publicly visible</strong> to anyone with the link
              {site?.slug ? ` (vowz.me/${site.slug})` : ""}. Search engines and guests may see
              names, dates, photos and event details. You can unpublish at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setPublishConfirmOpen(false);
                await doTogglePublish(true);
              }}
            >
              Yes, make it public
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        <span className="font-body text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="font-display text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// ─── Guest List Panel ─────────────────────────────────────────────────
function GuestListPanel({ rsvps, rsvpLoading, onDelete, site, copyLink }: {
  rsvps: RsvpRow[]; rsvpLoading: boolean; onDelete: (id: string) => void; site: any; copyLink: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "attending" | "not_attending">("all");

  const filtered = rsvps.filter((r) => {
    const matchesSearch = r.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      r.guest_email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "attending" && r.attending) ||
      (statusFilter === "not_attending" && !r.attending);
    return matchesSearch && matchesStatus;
  });

  const attendingCount = rsvps.filter((r) => r.attending).length;
  const notAttendingCount = rsvps.filter((r) => !r.attending).length;
  const totalHeadcount = rsvps.filter((r) => r.attending).reduce((s, r) => s + r.guest_count, 0);

  const mealSummary = rsvps.filter((r) => r.attending && r.meal_preference).reduce((acc, r) => {
    const meal = (r.meal_preference || "not specified").toLowerCase();
    acc[meal] = (acc[meal] || 0) + r.guest_count;
    return acc;
  }, {} as Record<string, number>);

  const exportCSV = () => {
    const headers = ["Name", "Email", "RSVP Status", "Guests", "Meal Preference", "Message", "Date"];
    const rows = rsvps.map((r) => [
      r.guest_name, r.guest_email, r.attending ? "Attending" : "Not Attending",
      String(r.guest_count), r.meal_preference || "", r.message || "",
      new Date(r.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "guest-list.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Guest List</h2>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Responses update automatically as guests RSVP.
            </p>
          </div>
          {rsvps.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          )}
        </div>

        {/* Summary stats */}
        {rsvps.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="font-display text-2xl font-bold text-foreground">{rsvps.length}</p>
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Total Responses</p>
            </div>
            <div className="bg-emerald/5 rounded-xl p-3 text-center">
              <p className="font-display text-2xl font-bold text-emerald">{attendingCount}</p>
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Attending</p>
            </div>
            <div className="bg-destructive/5 rounded-xl p-3 text-center">
              <p className="font-display text-2xl font-bold text-destructive">{notAttendingCount}</p>
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Declined</p>
            </div>
            <div className="bg-gold/5 rounded-xl p-3 text-center">
              <p className="font-display text-2xl font-bold text-gold">{totalHeadcount}</p>
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Total Headcount</p>
            </div>
          </div>
        )}

        {/* Meal summary */}
        {Object.keys(mealSummary).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="font-body text-xs text-muted-foreground font-medium">Meals:</span>
            {Object.entries(mealSummary).map(([meal, count]) => (
              <span key={meal} className="font-body text-xs bg-muted px-2 py-0.5 rounded-full capitalize">
                {meal}: {count}
              </span>
            ))}
          </div>
        )}

        {/* Search & filter */}
        {rsvps.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                aria-label="Search RSVPs by guest name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 font-body text-sm"
              />
            </div>
            <div className="flex gap-1.5">
              {(["all", "attending", "not_attending"] as const).map((f) => (
                <Button
                  key={f}
                  variant={statusFilter === f ? "default" : "outline"}
                  size="sm"
                  className="font-body text-xs h-9"
                  onClick={() => setStatusFilter(f)}
                >
                  {f === "all" ? "All" : f === "attending" ? "Attending" : "Declined"}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {rsvpLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <ul role="list" aria-label={`${filtered.length} RSVP${filtered.length === 1 ? "" : "s"}`} className="divide-y divide-border/30 list-none p-0 m-0">
          {filtered.map((rsvp) => (
            <RsvpRow key={rsvp.id} rsvp={rsvp} onDelete={onDelete} />
          ))}
        </ul>
      ) : rsvps.length > 0 ? (
        <div className="p-12 text-center">
          <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="font-body text-sm text-muted-foreground">No results match your filter.</p>
        </div>
      ) : (
        <div className="p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">
            RSVPs will appear here once guests respond to your invitation.
          </p>
          {site?.is_published && site?.slug && (
            <Button variant="outline" size="sm" className="mt-4" onClick={copyLink}>
              <Copy className="w-4 h-4 mr-1" /> Copy site link to share
            </Button>
          )}
        </div>
      )}
    </div>
  );
}


function RsvpRow({ rsvp, onDelete }: { rsvp: RsvpRow; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const statusText = rsvp.attending ? "Attending" : "Declined";
  const guestSuffix = rsvp.attending
    ? `, ${rsvp.guest_count} guest${rsvp.guest_count > 1 ? "s" : ""}`
    : "";

  return (
    <li role="listitem" aria-label={`${rsvp.guest_name}, ${statusText}${guestSuffix}`} className="px-4 sm:px-6 py-4 list-none">
      <div className="flex items-start sm:items-center gap-3">
        <div
          role="img"
          aria-label={statusText}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
          rsvp.attending ? "bg-emerald/10" : "bg-destructive/10"
        }`}>
          {rsvp.attending ? (
            <Check className="w-4 h-4 text-emerald" aria-hidden="true" />
          ) : (
            <X className="w-4 h-4 text-destructive" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-medium text-foreground truncate">{rsvp.guest_name}</p>
          <span className="sr-only">Status: {statusText}.</span>
          <p className="font-body text-xs text-muted-foreground truncate">{rsvp.guest_email}</p>
          <div className="flex items-center gap-2 mt-1 sm:hidden">
            {rsvp.attending && (
              <span className="font-body text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {rsvp.guest_count} guest{rsvp.guest_count > 1 ? "s" : ""}
              </span>
            )}
            <span className="font-body text-xs text-muted-foreground">
              <span className="sr-only">Responded on </span>
              {new Date(rsvp.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {rsvp.attending && (
            <span className="font-body text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded hidden sm:inline">
              {rsvp.guest_count} guest{rsvp.guest_count > 1 ? "s" : ""}
            </span>
          )}
          <span className="font-body text-xs text-muted-foreground hidden sm:inline">
            <span className="sr-only">Responded on </span>
            {new Date(rsvp.created_at).toLocaleDateString()}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={expanded ? `Hide details for ${rsvp.guest_name}` : `Show details for ${rsvp.guest_name}`}
            className="text-muted-foreground hover:text-foreground p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {expanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </button>
          <button
            onClick={() => onDelete(rsvp.id)}
            aria-label={`Delete RSVP from ${rsvp.guest_name}`}
            className="text-muted-foreground hover:text-destructive p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {expanded && (
        <motion.div id={detailsId} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 ml-11 space-y-1.5">
          {rsvp.meal_preference && (
            <p className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
              <Utensils className="w-3 h-3" aria-hidden="true" /> Meal: <span className="capitalize">{rsvp.meal_preference}</span>
            </p>
          )}
          {rsvp.selected_events && (rsvp.selected_events as any).length > 0 && (
            <p className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
              <PartyPopper className="w-3 h-3" aria-hidden="true" /> Events: {(rsvp.selected_events as any).join(", ")}
            </p>
          )}
          {rsvp.message && (
            <p className="font-body text-xs text-muted-foreground italic"><span className="sr-only">Message from guest: </span>"{rsvp.message}"</p>
          )}
        </motion.div>
      )}
    </li>
  );
}

// ─── Editable Field ───────────────────────────────────────────────────
function EditableField({
  label,
  value,
  onSave,
  icon: Icon,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  icon: any;
}) {
  const reactId = useId();
  const inputId = `editable-${reactId}`;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    if (draft.trim() !== value) onSave(draft.trim());
    setEditing(false);
  };

  return (
    <div>
      <label htmlFor={inputId} className="font-body text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      {editing ? (
        <div className="flex gap-2">
          <Input
            id={inputId}
            aria-label={label}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="font-body text-sm h-8"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button variant="gold" size="sm" className="h-8 px-2" onClick={handleSave} aria-label="Save">
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => { setDraft(value); setEditing(false); }} aria-label="Cancel">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className="font-body text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            aria-label="Edit"
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Checklist Panel ──────────────────────────────────────────────────
function ChecklistPanel({ siteId, accent }: { siteId: string; accent: string }) {
  const { items, loading, loadChecklist, addItem, toggleItem, deleteItem, updateItem, completedCount, progress } = useWeddingChecklist(siteId);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Planning");
  const [newDueDate, setNewDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addItem(newTitle.trim(), newCategory, newDueDate || null);
    setNewTitle("");
    setNewDueDate("");
    setShowAdd(false);
    toast({ title: "Task added ✓" });
  };

  const filtered = items.filter((i) => {
    if (filter === "pending") return !i.is_completed;
    if (filter === "done") return i.is_completed;
    return true;
  });

  const categories = [...new Set(items.map((i) => i.category))];
  const CATEGORY_OPTIONS = ["Planning", "Venue", "Guests", "Vendors", "Attire", "Food", "Entertainment", "Decor", "Logistics", "Legal", "Events", "Ceremony"];

  if (loading) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-card border border-border/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Wedding Checklist</h2>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              {completedCount} of {items.length} tasks completed
            </p>
          </div>
          <div className="text-right">
            <span className="font-display text-2xl font-bold" style={{ color: accent }}>{progress}%</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Filters & Add */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "pending", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
              filter === f
                ? "text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            style={filter === f ? { backgroundColor: accent } : undefined}
          >
            {f === "all" ? `All (${items.length})` : f === "pending" ? `Pending (${items.length - completedCount})` : `Done (${completedCount})`}
          </button>
        ))}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-card border border-border/50 rounded-xl p-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Task name..."
              aria-label="New task title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="font-body text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              aria-label="Task category"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm font-body"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Input
              type="date"
              aria-label="Task due date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="font-body text-sm"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="gold" size="sm" onClick={handleAdd} disabled={!newTitle.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* Grouped by category */}
      {categories.length > 0 && (
        <div className="space-y-3">
          {categories.map((cat) => {
            const catItems = filtered.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;
            const catDone = catItems.filter((i) => i.is_completed).length;
            return (
              <div key={cat} className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-foreground">{cat}</h3>
                  <span className="text-xs font-body text-muted-foreground">{catDone}/{catItems.length}</span>
                </div>
                <div className="divide-y divide-border/20">
                  {catItems.map((item) => (
                    <ChecklistRow
                      key={item.id}
                      item={item}
                      accent={accent}
                      onToggle={() => toggleItem(item.id)}
                      onDelete={() => deleteItem(item.id)}
                      onUpdate={(updates) => updateItem(item.id, updates)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">
            {filter === "done" ? "No completed tasks yet." : filter === "pending" ? "All tasks completed! 🎉" : "No tasks yet. Click 'Add Task' to get started."}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Checklist Row ────────────────────────────────────────────────────
function ChecklistRow({
  item,
  accent,
  onToggle,
  onDelete,
  onUpdate,
}: {
  item: import("@/hooks/use-wedding-checklist").ChecklistItem;
  accent: string;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: { title?: string; due_date?: string | null; notes?: string | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDate, setEditDate] = useState(item.due_date || "");

  const isOverdue = item.due_date && !item.is_completed && new Date(item.due_date) < new Date();

  const handleSave = () => {
    onUpdate({
      title: editTitle.trim() || item.title,
      due_date: editDate || null,
    });
    setEditing(false);
  };

  return (
    <div className="px-4 py-3 flex items-start gap-3 group">
      <button
        onClick={onToggle}
        role="checkbox"
        aria-checked={item.is_completed}
        aria-label={item.is_completed ? `Mark "${item.title}" as incomplete` : `Mark "${item.title}" as complete`}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          item.is_completed ? "border-transparent" : "border-border hover:border-foreground/50"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
        style={item.is_completed ? { backgroundColor: accent } : undefined}
      >
        {item.is_completed && <Check className="w-3 h-3 text-primary-foreground" />}
      </button>

      {editing ? (
        <div className="flex-1 space-y-2">
          <Input
            value={editTitle}
            aria-label="Edit task title"
            onChange={(e) => setEditTitle(e.target.value)}
            className="font-body text-sm h-8"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Input
            type="date"
            aria-label="Edit task due date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="font-body text-sm h-8 w-40"
          />
          <div className="flex gap-1">
            <Button variant="gold" size="sm" className="h-7 px-2 text-xs" onClick={handleSave}>Save</Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <p className={`font-body text-sm ${item.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {item.is_completed && <span className="sr-only">Completed. </span>}
            {item.title}
          </p>
          {item.due_date && (
            <p
              className={`font-body text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
              aria-label={`${isOverdue ? "Overdue. " : ""}Due ${format(new Date(item.due_date + "T00:00:00"), "MMMM d, yyyy")}`}
            >
              <CalendarDays className="w-3 h-3" aria-hidden="true" />
              <span aria-hidden="true">
                {format(new Date(item.due_date + "T00:00:00"), "MMM d, yyyy")}
                {isOverdue && " · Overdue"}
              </span>
            </p>
          )}
        </div>
      )}

      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => { setEditTitle(item.title); setEditDate(item.due_date || ""); setEditing(true); }}
            aria-label={`Edit "${item.title}"`}
            className="text-muted-foreground hover:text-foreground p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Delete "${item.title}"`}
            className="text-muted-foreground hover:text-destructive p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────
function AnalyticsPanel({ siteId, accent }: { siteId: string; accent: string }) {
  const { fetchAnalytics } = useSiteAnalytics(siteId);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics().then((data) => {
      setAnalytics(data);
      setLoading(false);
    });
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
        <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-body text-sm text-muted-foreground">No analytics data yet. Publish your site and share it to start tracking visitors.</p>
      </div>
    );
  }

  const maxViews = Math.max(...analytics.dailyViews.map((d: any) => d.views), 1);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AnalyticsStat icon={Eye} label="Page Views" value={analytics.totalPageViews} accent={accent} />
        <AnalyticsStat icon={Users} label="Unique Visitors" value={analytics.uniqueVisitors} accent="#5B8DEF" />
        <AnalyticsStat icon={TrendingUp} label="RSVP Conversion" value={`${analytics.conversionRate}%`} accent="#2D5016" />
        <AnalyticsStat icon={MessageSquare} label="Guestbook Posts" value={analytics.guestbookPosts} accent="#8B5CF6" />
      </div>

      {/* Daily views chart */}
      {analytics.dailyViews.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Daily Views (Last 30 Days)</h3>
          <div className="flex items-end gap-1 h-32">
            {analytics.dailyViews.map((day: any) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t transition-all hover:opacity-80 min-h-[4px]"
                  style={{
                    height: `${(day.views / maxViews) * 100}%`,
                    backgroundColor: accent,
                  }}
                />
                <div className="absolute -top-8 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-body">
                  {day.date.slice(5)}: {day.views} views
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground font-body">{analytics.dailyViews[0]?.date.slice(5)}</span>
            <span className="text-xs text-muted-foreground font-body">{analytics.dailyViews[analytics.dailyViews.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Recent events */}
      {analytics.recentEvents.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border/30">
            <h3 className="font-display text-lg font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border/30 max-h-80 overflow-y-auto">
            {analytics.recentEvents.map((event: any) => (
              <div key={event.id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}20` }}>
                  {event.event_type === "page_view" && <Eye className="w-3.5 h-3.5" style={{ color: accent }} />}
                  {event.event_type === "rsvp_submit" && <Check className="w-3.5 h-3.5 text-emerald" />}
                  {event.event_type === "guestbook_post" && <MessageSquare className="w-3.5 h-3.5 text-purple-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground capitalize">
                    {event.event_type.replace(/_/g, " ")}
                  </p>
                </div>
                <span className="font-body text-xs text-muted-foreground shrink-0">
                  {new Date(event.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SharePlatformsPanel siteId={siteId} accent={accent} />
      <ShareAttributionPanel siteId={siteId} accent={accent} />
    </div>
  );
}

function AnalyticsStat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="font-body text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Email Verify Banner ─── */
function EmailVerifyBanner({ userEmail, onVerified }: { userEmail: string; onVerified: () => void }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      const markVerified = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({ email_verified: true } as any).eq("id", user.id);
          onVerified();
          toast({ title: "Email verified successfully! ✅", description: "Welcome to Vowz! Your account is now fully activated." });
          searchParams.delete("verified");
          setSearchParams(searchParams, { replace: true });
          setVerified(true);
        }
      };
      markVerified();
    }
  }, [searchParams]);

  const handleSendVerification = async () => {
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: "https://vowz.me/dashboard?verified=true",
        },
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Verification email sent! 📧", description: `Check your inbox at ${userEmail}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (verified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 bg-emerald/10 border border-emerald/30 rounded-xl p-4 flex items-center gap-3"
      >
        <ShieldCheck className="w-5 h-5 text-emerald shrink-0" />
        <div>
          <p className="font-body text-sm font-medium text-foreground">Email verified successfully! 🎉</p>
          <p className="font-body text-xs text-muted-foreground">Your account is fully activated. You're all set!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-accent/10 border border-accent/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
    >
      <div className="flex items-center gap-2 flex-1">
        <Mail className="w-5 h-5 text-accent shrink-0" />
        <div>
          <p className="font-body text-sm font-medium text-foreground">Verify your email</p>
          <p className="font-body text-xs text-muted-foreground">
            {sent
              ? `Verification link sent to ${userEmail}. Check your inbox!`
              : `Please verify ${userEmail} to secure your account.`}
          </p>
        </div>
      </div>
      {!sent && (
        <Button variant="gold" size="sm" onClick={handleSendVerification} disabled={sending}>
          <Mail className="w-4 h-4 mr-1" />
          {sending ? "Sending..." : "Verify Email"}
        </Button>
      )}
      {sent && (
        <Button variant="outline" size="sm" onClick={handleSendVerification} disabled={sending}>
          {sending ? "Sending..." : "Resend"}
        </Button>
      )}
    </motion.div>
  );
}

// ─── Blessing Moderation Card ─────────────────────────────────────────
function BlessingModerationCard({
  blessing,
  onApprove,
  onReject,
  onReply,
  onDelete,
}: {
  blessing: any;
  onApprove: () => void;
  onReject: () => void;
  onReply: (reply: string) => void;
  onDelete: () => void;
}) {
  const [replyText, setReplyText] = useState(blessing.owner_reply || "");
  const [showReply, setShowReply] = useState(false);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
  };

  return (
    <article role="listitem" aria-label={`Blessing from ${blessing.guest_name}, status ${blessing.status}`} className="border border-border/50 rounded-xl p-4 bg-background">
      <div className="flex items-start gap-3">
        {blessing.photo_url && (
          <img
            src={blessing.photo_url}
            alt={`Photo from ${blessing.guest_name}`}
            className="w-12 h-12 rounded-lg object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-body text-sm font-semibold text-foreground">{blessing.guest_name}</span>
            <span
              role="status"
              aria-label={`Status: ${blessing.status}`}
              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-body font-medium ${statusColors[blessing.status] || ""}`}
            >
              {blessing.status}
            </span>
            <span className="text-[10px] text-muted-foreground font-body ml-auto">
              <span className="sr-only">Submitted on </span>
              {new Date(blessing.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="font-body text-sm text-muted-foreground mt-1">
            <span className="sr-only">Message: </span>
            {blessing.message}
          </p>

          {blessing.owner_reply && !showReply && (
            <div className="mt-2 pl-3 border-l-2 border-gold/30">
              <p className="font-body text-xs text-muted-foreground italic">
                <span aria-hidden="true">💕 </span>
                <span className="sr-only">Your reply: </span>
                {blessing.owner_reply}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {blessing.status === "pending" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="font-body text-xs h-7"
              onClick={onApprove}
              aria-label={`Approve blessing from ${blessing.guest_name}`}
            >
              <Check className="w-3 h-3 mr-1" aria-hidden="true" /> Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-body text-xs h-7 text-destructive hover:text-destructive"
              onClick={onReject}
              aria-label={`Reject blessing from ${blessing.guest_name}`}
            >
              <X className="w-3 h-3 mr-1" aria-hidden="true" /> Reject
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="font-body text-xs h-7"
          onClick={() => setShowReply(!showReply)}
          aria-expanded={showReply}
          aria-label={showReply ? `Cancel reply to ${blessing.guest_name}` : `Reply to blessing from ${blessing.guest_name}`}
        >
          <MessageSquare className="w-3 h-3 mr-1" aria-hidden="true" /> {showReply ? "Cancel" : "Reply"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="font-body text-xs h-7 text-destructive hover:text-destructive ml-auto"
          onClick={onDelete}
          aria-label={`Delete blessing from ${blessing.guest_name}`}
        >
          <Trash2 className="w-3 h-3" aria-hidden="true" />
        </Button>
      </div>

      {showReply && (
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Write a reply to this blessing..."
            aria-label={`Reply to blessing from ${blessing.guest_name}`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="font-body text-sm h-8 flex-1"
          />
          <Button
            variant="gold"
            size="sm"
            className="font-body text-xs h-8"
            onClick={() => { onReply(replyText); setShowReply(false); }}
            disabled={!replyText.trim()}
          >
            Save
          </Button>
        </div>
      )}
    </article>
  );
}

export default Dashboard;

// ─── Shares By Platform Panel ─────────────────────────────────────────
// Complete per-platform breakdown of share activity: raw click count,
// unique visitors it drove to the site, and RSVP/guestbook sign-ups
// attributed by matching visitor_id back to the earliest UTM page view.
const PLATFORM_META: Record<string, { label: string; color: string }> = {
  whatsapp:  { label: "WhatsApp",  color: "#25D366" },
  instagram: { label: "Instagram", color: "#DD2A7B" },
  facebook:  { label: "Facebook",  color: "#1877F2" },
  twitter:   { label: "X",         color: "#000000" },
  telegram:  { label: "Telegram",  color: "#26A5E4" },
  linkedin:  { label: "LinkedIn",  color: "#0A66C2" },
  email:     { label: "Email",     color: "#6B7280" },
  copy_url:  { label: "Copy URL",  color: "#D4AF37" },
  native:    { label: "Native",    color: "#6B7280" },
};

function SharePlatformsPanel({ siteId, accent }: { siteId: string; accent: string }) {
  const [platforms, setPlatforms] = useState<
    Array<{ key: string; clicks: number; visitors: number; signups: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!siteId) return;
      setLoading(true);
      const { data } = await supabase
        .from("site_analytics" as any)
        .select("event_type, metadata, visitor_id, created_at")
        .eq("wedding_site_id", siteId)
        .order("created_at", { ascending: true })
        .limit(5000);
      if (cancelled) return;

      const rows = (data as any[]) || [];
      const clicks: Record<string, number> = {};
      const visitorSource = new Map<string, string>(); // earliest utm_source per visitor
      const visitorsByKey: Record<string, Set<string>> = {};
      const signups: Record<string, number> = {};

      const readSource = (meta: any): string | undefined => {
        try {
          if (meta?.url) {
            const u = new URL(meta.url);
            const s = u.searchParams.get("utm_source");
            if (s) return s;
          }
        } catch { /* ignore */ }
        return meta?.utm_source || meta?.channel || meta?.platform;
      };

      for (const ev of rows) {
        if (ev.event_type === "share_click") {
          const key = ev.metadata?.channel || ev.metadata?.platform || "other";
          clicks[key] = (clicks[key] || 0) + 1;
        } else if (ev.event_type === "page_view" && ev.visitor_id) {
          if (visitorSource.has(ev.visitor_id)) continue;
          const src = readSource(ev.metadata);
          if (!src) continue;
          visitorSource.set(ev.visitor_id, src);
          (visitorsByKey[src] ||= new Set()).add(ev.visitor_id);
        }
      }
      for (const ev of rows) {
        if (ev.event_type !== "rsvp_submit" && ev.event_type !== "guestbook_post") continue;
        const src = visitorSource.get(ev.visitor_id);
        if (!src) continue;
        signups[src] = (signups[src] || 0) + 1;
      }

      const keys = new Set<string>([
        ...Object.keys(clicks),
        ...Object.keys(signups),
        ...Object.keys(visitorsByKey),
      ]);
      const list = Array.from(keys)
        .map((key) => ({
          key,
          clicks: clicks[key] || 0,
          visitors: visitorsByKey[key]?.size || 0,
          signups: signups[key] || 0,
        }))
        .sort((a, b) => (b.clicks + b.signups * 5) - (a.clicks + a.signups * 5));
      setPlatforms(list);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [siteId]);

  const totalClicks = platforms.reduce((a, b) => a + b.clicks, 0);

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border/30 flex items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Shares by platform</h3>
          <p className="font-body text-xs text-muted-foreground">
            Complete breakdown of clicks, visitors and sign-ups driven by each social platform.
          </p>
        </div>
        <span className="text-xs font-body text-muted-foreground">
          Total clicks: <span className="font-mono text-foreground">{totalClicks}</span>
        </span>
      </div>
      {loading ? (
        <div className="p-8 text-center">
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : platforms.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground font-body">
          No shares recorded yet. Use the Share buttons to start tracking activity.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 sm:p-6">
          {platforms.map((p) => {
            const meta = PLATFORM_META[p.key] || { label: p.key, color: accent };
            const conv = p.visitors > 0 ? ((p.signups / p.visitors) * 100).toFixed(0) + "%" : "—";
            return (
              <div key={p.key} className="rounded-xl border border-border/40 bg-background/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
                  <span className="font-body text-sm text-foreground">{meta.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <Stat n={p.clicks} label="Clicks" />
                  <Stat n={p.visitors} label="Visitors" />
                  <Stat n={p.signups} label="Sign-ups" />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground font-body text-center">
                  Conv. <span className="font-mono text-foreground">{conv}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="font-display text-base font-bold text-foreground leading-none">{n}</p>
      <p className="text-[10px] text-muted-foreground font-body">{label}</p>
    </div>
  );
}

// ─── Share Attribution Panel ──────────────────────────────────────────
// Summarizes share clicks by utm_source / utm_campaign and correlates
// them with sign-ups (RSVP + guestbook posts) for the current site slug,
// attributing each conversion to the utm_source of the visitor's most
// recent page_view that carried a utm_source.
function ShareAttributionPanel({ siteId, accent }: { siteId: string; accent: string }) {
  const [rows, setRows] = useState<
    Array<{ source: string; campaign: string; clicks: number; visitors: number; signups: number; rate: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ clicks: 0, signups: 0, attributed: 0 });
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!siteId) return;
      setLoading(true);

      const [{ data: siteRow }, { data: events }] = await Promise.all([
        supabase.from("wedding_sites").select("slug").eq("id", siteId).maybeSingle(),
        supabase
          .from("site_analytics" as any)
          .select("event_type, metadata, visitor_id, created_at")
          .eq("wedding_site_id", siteId)
          .order("created_at", { ascending: true })
          .limit(5000),
      ]);
      if (cancelled) return;
      setSlug((siteRow as any)?.slug || "");

      const list = (events as any[]) || [];

      // Read utm_* from event.metadata.url when present, else metadata directly.
      const parseUtm = (meta: any): { source?: string; campaign?: string } => {
        try {
          if (meta?.url) {
            const u = new URL(meta.url);
            return {
              source: u.searchParams.get("utm_source") || meta?.channel || meta?.platform || undefined,
              campaign: u.searchParams.get("utm_campaign") || undefined,
            };
          }
        } catch { /* ignore */ }
        return {
          source: meta?.utm_source || meta?.channel || meta?.platform,
          campaign: meta?.utm_campaign,
        };
      };

      // 1) Click counts per (source, campaign)
      const buckets = new Map<
        string,
        { source: string; campaign: string; clicks: number; visitors: Set<string>; signups: number }
      >();
      const key = (s: string, c: string) => `${s}||${c}`;

      for (const ev of list) {
        if (ev.event_type !== "share_click") continue;
        const { source = "(direct)", campaign = "(none)" } = parseUtm(ev.metadata);
        const k = key(source, campaign);
        if (!buckets.has(k)) buckets.set(k, { source, campaign, clicks: 0, visitors: new Set(), signups: 0 });
        buckets.get(k)!.clicks++;
      }

      // 2) Map each visitor to their earliest utm_source/campaign from page_views
      const visitorAttribution = new Map<string, { source: string; campaign: string }>();
      for (const ev of list) {
        if (ev.event_type !== "page_view" || !ev.visitor_id) continue;
        if (visitorAttribution.has(ev.visitor_id)) continue; // keep earliest
        const { source, campaign } = parseUtm(ev.metadata);
        if (!source) continue;
        visitorAttribution.set(ev.visitor_id, { source, campaign: campaign || "(none)" });
      }

      // 3) Attribute sign-ups (rsvp_submit + guestbook_post) to that visitor's source
      let totalSignups = 0;
      let attributedSignups = 0;
      for (const ev of list) {
        if (ev.event_type !== "rsvp_submit" && ev.event_type !== "guestbook_post") continue;
        totalSignups++;
        const attr = visitorAttribution.get(ev.visitor_id);
        if (!attr) continue;
        attributedSignups++;
        const k = key(attr.source, attr.campaign);
        if (!buckets.has(k)) buckets.set(k, { source: attr.source, campaign: attr.campaign, clicks: 0, visitors: new Set(), signups: 0 });
        buckets.get(k)!.signups++;
      }

      // 4) Count unique attributed visitors per bucket
      for (const [visitorId, attr] of visitorAttribution) {
        const k = key(attr.source, attr.campaign);
        if (!buckets.has(k)) buckets.set(k, { source: attr.source, campaign: attr.campaign, clicks: 0, visitors: new Set(), signups: 0 });
        buckets.get(k)!.visitors.add(visitorId);
      }

      const totalClicks = Array.from(buckets.values()).reduce((a, b) => a + b.clicks, 0);
      const result = Array.from(buckets.values())
        .map((b) => ({
          source: b.source,
          campaign: b.campaign,
          clicks: b.clicks,
          visitors: b.visitors.size,
          signups: b.signups,
          rate: b.visitors.size > 0 ? ((b.signups / b.visitors.size) * 100).toFixed(1) + "%" : "—",
        }))
        .sort((a, b) => (b.clicks + b.signups) - (a.clicks + a.signups));

      setRows(result);
      setTotals({ clicks: totalClicks, signups: totalSignups, attributed: attributedSignups });
      setLoading(false);
    }
    run();
    return () => { cancelled = true; };
  }, [siteId]);

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border/30 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Share attribution</h3>
          <p className="font-body text-xs text-muted-foreground">
            Share clicks by UTM source/campaign correlated with sign-ups
            {slug ? <> for <span className="font-mono text-foreground">/site/{slug}</span></> : null}.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-body">
          <span><span className="text-muted-foreground">Clicks:</span> <span className="font-mono text-foreground">{totals.clicks}</span></span>
          <span><span className="text-muted-foreground">Sign-ups:</span> <span className="font-mono text-foreground">{totals.signups}</span></span>
          <span><span className="text-muted-foreground">Attributed:</span> <span className="font-mono text-foreground">{totals.attributed}</span></span>
        </div>
      </div>
      {loading ? (
        <div className="p-8 text-center">
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground font-body">
          No share clicks yet. Share your site to start attributing sign-ups.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="text-left px-4 sm:px-6 py-2 font-medium">Source</th>
                <th className="text-left px-3 py-2 font-medium">Campaign</th>
                <th className="text-right px-3 py-2 font-medium">Clicks</th>
                <th className="text-right px-3 py-2 font-medium">Visitors</th>
                <th className="text-right px-3 py-2 font-medium">Sign-ups</th>
                <th className="text-right px-4 sm:px-6 py-2 font-medium">Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map((r) => (
                <tr key={`${r.source}-${r.campaign}`} className="hover:bg-muted/20">
                  <td className="px-4 sm:px-6 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                      <span className="font-mono text-foreground">{r.source}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{r.campaign}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{r.clicks}</td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">{r.visitors}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{r.signups}</td>
                  <td className="px-4 sm:px-6 py-2 text-right font-mono" style={{ color: r.signups > 0 ? accent : undefined }}>{r.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── RSVP Reminder Card ─────────────────────────────────────────────────
// Reads events from the wedding site's sections plus the RSVP section's
// reminder_offsets_days and reminder_message. Computes for each event a list
// of due dates (event date - offset days) and surfaces WhatsApp "compose"
// links so the couple can send the reminder to their guest list. This is the
// honest ceiling for a web app — WhatsApp cannot dispatch messages without a
// Business API, so the automation is: precomputed schedule + one-tap send.
function RsvpReminderCard({ site }: { site: any }) {
  const sections: any[] = Array.isArray(site?.sections) ? site.sections : [];
  const rsvpSection = sections.find((s) => s?.type === "rsvp");
  if (!rsvpSection) return null;

  const offsets: number[] = Array.isArray(rsvpSection.data?.reminder_offsets_days)
    ? rsvpSection.data.reminder_offsets_days
    : [14, 7, 2];
  if (offsets.length === 0) return null;

  const template: string =
    rsvpSection.data?.reminder_message ||
    "Reminder: {event} is on {date}. Please RSVP here → {link}";

  const events: { name: string; date: string }[] = [];
  sections
    .filter((s) => s?.type === "events")
    .forEach((s) => {
      (s.data?.events || []).forEach((e: any) => {
        if (e?.date) events.push({ name: e.name || "Event", date: e.date });
      });
    });
  if (events.length === 0) return null;

  const publicUrl =
    typeof window !== "undefined" && site?.slug
      ? `${window.location.origin}/site/${site.slug}`
      : "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  type Row = { key: string; eventName: string; eventDate: Date; dueDate: Date; offset: number; daysAway: number };
  const rows: Row[] = [];
  events.forEach((ev) => {
    const eventDate = new Date(ev.date);
    if (isNaN(eventDate.getTime())) return;
    eventDate.setHours(0, 0, 0, 0);
    offsets.forEach((offset) => {
      const dueDate = new Date(eventDate);
      dueDate.setDate(dueDate.getDate() - offset);
      const daysAway = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      // Show upcoming + 3 days of grace after due date.
      if (daysAway < -3) return;
      rows.push({ key: `${ev.name}-${offset}`, eventName: ev.name, eventDate, dueDate, offset, daysAway });
    });
  });
  if (rows.length === 0) return null;
  rows.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const composeWhatsappUrl = (row: Row) => {
    const msg = template
      .replaceAll("{event}", row.eventName)
      .replaceAll("{date}", row.eventDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }))
      .replaceAll("{link}", publicUrl);
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Automated RSVP reminders</h3>
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            Scheduled from your event dates. Tap Send when it's due — WhatsApp opens with the message ready for your guest list.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-border/50">
        {rows.map((r) => {
          const dueLabel =
            r.daysAway === 0 ? "Due today" :
            r.daysAway > 0 ? `In ${r.daysAway}d` :
            `${-r.daysAway}d overdue`;
          const isDue = r.daysAway <= 0;
          return (
            <li key={r.key} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-body text-sm text-foreground truncate">
                  {r.eventName} <span className="text-muted-foreground">· {r.offset}d before</span>
                </p>
                <p className="font-body text-[11px] text-muted-foreground">
                  {r.dueDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {dueLabel}
                </p>
              </div>
              <a
                href={composeWhatsappUrl(r)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-body text-white shrink-0 ${isDue ? "" : "opacity-70"}`}
                style={{ backgroundColor: "#25D366" }}
              >
                Send WhatsApp
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
