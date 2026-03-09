import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Edit3, Eye, ExternalLink, Globe, GlobeLock,
  Users, Calendar, Mail, ChevronDown, ChevronUp,
  Settings, LogOut, Sparkles, Plus, Check, X, Copy,
  User, MapPin, Utensils, PartyPopper, Clock, Trash2,
  BarChart3, TrendingUp, MousePointer, MessageSquare,
  ClipboardList, CalendarDays, Search, Crown, ShieldCheck, ExternalLink as ExternalLinkIcon,
  IndianRupee
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useWeddingSite } from "@/hooks/use-wedding-site";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSiteAnalytics } from "@/hooks/use-analytics";
import { useWeddingChecklist } from "@/hooks/use-wedding-checklist";
import BudgetTracker from "@/components/BudgetTracker";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { loadUserSite, updateSite, saving } = useWeddingSite();
  const [site, setSite] = useState<any>(null);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Load site & profile
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      loadUserSite(),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]).then(([siteData, { data: profile }]) => {
      setSite(siteData);
      setProfileData(profile);
      setLoading(false);
      if (siteData) loadRsvps(siteData.id);
    });
  }, [user]);

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
    const newStatus = !site.is_published;
    const success = await updateSite(site.id, { is_published: newStatus });
    if (success) {
      setSite({ ...site, is_published: newStatus });
      toast({
        title: newStatus ? "Site published! 🎉" : "Site unpublished",
        description: newStatus
          ? "Your wedding site is now live!"
          : "Your site is no longer publicly accessible.",
      });
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const attendingCount = rsvps.filter((r) => r.attending).length;
  const totalGuests = rsvps.filter((r) => r.attending).reduce((sum, r) => sum + r.guest_count, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-gold" fill="currentColor" />
            <span className="font-display text-lg font-semibold text-foreground">Bhalf</span>
          </Link>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5 sm:py-8">
        {/* Welcome */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Welcome{profileData?.full_name ? `, ${profileData.full_name}` : ""}! 💍
          </h1>
          <p className="text-muted-foreground font-body mt-1 text-sm sm:text-base">
            Manage your wedding site, view RSVPs, and customize settings.
          </p>
        </div>

        {!site ? (
          /* No site yet */
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
              Our AI wizard will help you build a beautiful wedding website in minutes.
            </p>
            <Button variant="gold" size="lg" asChild>
              <Link to="/wizard">
                <Sparkles className="w-4 h-4 mr-2" /> Start AI Wizard
              </Link>
            </Button>
          </motion.div>
        ) : (
          /* Has site */
          <Tabs defaultValue="overview" className="space-y-6">
             <TabsList className="bg-card border border-border/50 w-full overflow-x-auto flex-nowrap justify-start sm:justify-center">
              <TabsTrigger value="overview" className="font-body text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="checklist" className="font-body text-xs sm:text-sm">
                Checklist <ClipboardList className="w-3.5 h-3.5 ml-1 hidden sm:inline" />
              </TabsTrigger>
              <TabsTrigger value="analytics" className="font-body text-xs sm:text-sm">
                Analytics <BarChart3 className="w-3.5 h-3.5 ml-1 hidden sm:inline" />
              </TabsTrigger>
              <TabsTrigger value="rsvps" className="font-body text-xs sm:text-sm">
                RSVPs {rsvps.length > 0 && <span className="ml-1 sm:ml-1.5 bg-gold/20 text-gold text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">{rsvps.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="settings" className="font-body text-xs sm:text-sm">Settings</TabsTrigger>
            </TabsList>

            {/* ─── Overview Tab ─── */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Site card */}
                <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl overflow-hidden">
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

                  <div className="p-4 sm:p-6 flex flex-wrap gap-2 sm:gap-3">
                    <Button variant="gold" size="sm" asChild>
                      <Link to="/editor">
                        <Edit3 className="w-4 h-4 mr-1" /> Edit Site
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTogglePublish}
                      disabled={saving}
                    >
                      {site.is_published ? (
                        <><GlobeLock className="w-4 h-4 mr-1" /> Unpublish</>
                      ) : (
                        <><Globe className="w-4 h-4 mr-1" /> Publish</>
                      )}
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
                  </div>
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

            {/* ─── Checklist Tab ─── */}
            <TabsContent value="checklist">
              <ChecklistPanel siteId={site?.id} accent={(site.suggested_colors as any)?.[1] || "#D4A853"} />
            </TabsContent>

            {/* ─── Analytics Tab ─── */}
            <TabsContent value="analytics">
              <AnalyticsPanel siteId={site?.id} accent={(site.suggested_colors as any)?.[1] || "#D4A853"} />
            </TabsContent>

            {/* ─── RSVPs Tab ─── */}
            <TabsContent value="rsvps">
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border/30">
                  <h2 className="font-display text-xl font-bold text-foreground">Guest RSVPs</h2>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    {rsvps.length === 0
                      ? "No RSVPs yet. Share your site to start collecting responses!"
                      : `${rsvps.length} response${rsvps.length > 1 ? "s" : ""} received`}
                  </p>
                </div>

                {rsvps.length > 0 ? (
                  <div className="divide-y divide-border/30">
                    {rsvps.map((rsvp) => (
                      <RsvpRow key={rsvp.id} rsvp={rsvp} onDelete={handleDeleteRsvp} />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-body text-sm text-muted-foreground">
                      RSVPs will appear here once guests respond to your invitation.
                    </p>
                    {site.is_published && site.slug && (
                      <Button variant="outline" size="sm" className="mt-4" onClick={copyLink}>
                        <Copy className="w-4 h-4 mr-1" /> Copy site link to share
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ─── Settings Tab ─── */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Profile settings */}
                <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4">Profile</h2>
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
                          <button onClick={copyLink} className="text-muted-foreground hover:text-foreground">
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Domain — Premium Feature */}
              <div className="lg:col-span-2 mt-4 sm:mt-6">
                <CustomDomainPanel siteId={site.id} siteSlug={site.slug} siteName={`${site.partner1} & ${site.partner2}`} savedDomain={site.custom_domain} savedStatus={site.domain_status} onUpdate={(domain: string, status: string) => setSite({ ...site, custom_domain: domain, domain_status: status })} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
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

// ─── RSVP Row ─────────────────────────────────────────────────────────
function RsvpRow({ rsvp, onDelete }: { rsvp: RsvpRow; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="flex items-start sm:items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
          rsvp.attending ? "bg-emerald/10" : "bg-destructive/10"
        }`}>
          {rsvp.attending ? (
            <Check className="w-4 h-4 text-emerald" />
          ) : (
            <X className="w-4 h-4 text-destructive" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-medium text-foreground truncate">{rsvp.guest_name}</p>
          <p className="font-body text-xs text-muted-foreground truncate">{rsvp.guest_email}</p>
          <div className="flex items-center gap-2 mt-1 sm:hidden">
            {rsvp.attending && (
              <span className="font-body text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {rsvp.guest_count} guest{rsvp.guest_count > 1 ? "s" : ""}
              </span>
            )}
            <span className="font-body text-xs text-muted-foreground">
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
            {new Date(rsvp.created_at).toLocaleDateString()}
          </span>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(rsvp.id)} className="text-muted-foreground hover:text-destructive p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 ml-11 space-y-1.5">
          {rsvp.meal_preference && (
            <p className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
              <Utensils className="w-3 h-3" /> Meal: <span className="capitalize">{rsvp.meal_preference}</span>
            </p>
          )}
          {rsvp.selected_events && (rsvp.selected_events as any).length > 0 && (
            <p className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
              <PartyPopper className="w-3 h-3" /> Events: {(rsvp.selected_events as any).join(", ")}
            </p>
          )}
          {rsvp.message && (
            <p className="font-body text-xs text-muted-foreground italic">"{rsvp.message}"</p>
          )}
        </motion.div>
      )}
    </div>
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    if (draft.trim() !== value) onSave(draft.trim());
    setEditing(false);
  };

  return (
    <div>
      <label className="font-body text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      {editing ? (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="font-body text-sm h-8"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button variant="gold" size="sm" className="h-8 px-2" onClick={handleSave}>
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => { setDraft(value); setEditing(false); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className="font-body text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="font-body text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm font-body"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Input
              type="date"
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
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          item.is_completed ? "border-transparent" : "border-border hover:border-foreground/50"
        }`}
        style={item.is_completed ? { backgroundColor: accent } : undefined}
      >
        {item.is_completed && <Check className="w-3 h-3 text-white" />}
      </button>

      {editing ? (
        <div className="flex-1 space-y-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="font-body text-sm h-8"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Input
            type="date"
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
            {item.title}
          </p>
          {item.due_date && (
            <p className={`font-body text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
              <CalendarDays className="w-3 h-3" />
              {format(new Date(item.due_date + "T00:00:00"), "MMM d, yyyy")}
              {isOverdue && " · Overdue"}
            </p>
          )}
        </div>
      )}

      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => { setEditTitle(item.title); setEditDate(item.due_date || ""); setEditing(true); }}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-1">
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

// ─── Custom Domain Panel ─────────────────────────────────────────────
const DOMAIN_REGISTRARS = [
  { name: "GoDaddy India", url: "https://www.godaddy.com/en-in/domains", payment: "UPI, Cards, Net Banking, Wallets", logo: "🌐" },
  { name: "BigRock", url: "https://www.bigrock.in/domain-registration", payment: "UPI, Cards, Net Banking, Paytm", logo: "🪨" },
  { name: "Hostinger India", url: "https://www.hostinger.in/domain-name-search", payment: "UPI, Cards, Net Banking, PayPal", logo: "⚡" },
  { name: "Namecheap", url: "https://www.namecheap.com/domains/", payment: "Cards, PayPal, Bitcoin", logo: "💰" },
];

const WEDDING_TLDS = [
  { ext: ".com", label: "Global", emoji: "🌍", desc: "Universal & trusted" },
  { ext: ".in", label: "India", emoji: "🇮🇳", desc: "Perfect for Indian weddings" },
  { ext: ".love", label: "Romance", emoji: "💕", desc: "Made for love stories" },
  { ext: ".wedding", label: "Wedding", emoji: "💒", desc: "Dedicated wedding TLD" },
  { ext: ".co", label: "Modern", emoji: "✨", desc: "Short & trendy" },
  { ext: ".me", label: "Personal", emoji: "💑", desc: "Personal touch" },
];

function generateDomainSuggestions(partner1: string, partner2: string, tlds: string[]): string[] {
  const p1 = partner1.toLowerCase().replace(/[^a-z]/g, "");
  const p2 = partner2.toLowerCase().replace(/[^a-z]/g, "");
  if (!p1 || !p2) return [];
  const combos = [`${p1}and${p2}`, `${p1}weds${p2}`, `${p1}loves${p2}`, `${p1}${p2}`, `${p2}and${p1}`, `${p1}${p2}wedding`];
  const domains: string[] = [];
  combos.forEach((c) => { tlds.forEach((tld) => domains.push(`${c}${tld}`)); });
  return [...new Set(domains)];
}

type DomainResult = { domain: string; available: boolean | null; checking?: boolean };

const WIZARD_STEPS = [
  { id: 1, title: "Find Domain", icon: Search, desc: "Search or enter your domain" },
  { id: 2, title: "Purchase", icon: ExternalLinkIcon, desc: "Buy from a registrar" },
  { id: 3, title: "Configure DNS", icon: Settings, desc: "Point domain to your site" },
  { id: 4, title: "Verify & Go Live", icon: ShieldCheck, desc: "Confirm connection" },
];

function CustomDomainPanel({ siteId, siteSlug, siteName, savedDomain, savedStatus, onUpdate }: {
  siteId: string;
  siteSlug: string | null;
  siteName: string;
  savedDomain: string | null;
  savedStatus: string;
  onUpdate: (domain: string | null, status: string) => void;
}) {
  const currentStatus = savedStatus || "none";
  const hasSavedDomain = !!savedDomain && currentStatus !== "none";

  // Determine wizard step from saved status
  const getStepFromStatus = () => {
    if (currentStatus === "live") return 5; // completed
    if (currentStatus === "verified") return 4;
    if (currentStatus === "pending") return 3;
    return 1;
  };

  const [wizardStep, setWizardStep] = useState(getStepFromStatus());
  const [customDomain, setCustomDomain] = useState(savedDomain || "");
  const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [selectedTlds, setSelectedTlds] = useState<string[]>([".com", ".in", ".wedding"]);
  const [customCheckResult, setCustomCheckResult] = useState<DomainResult | null>(null);
  const [checkingCustom, setCheckingCustom] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(savedDomain || "");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const parts = siteName.split(/\s*&\s*/);
  const partner1 = parts[0]?.trim() || "";
  const partner2 = parts[1]?.trim() || "";

  const toggleTld = (tld: string) => {
    setSelectedTlds((prev) => prev.includes(tld) ? prev.filter((t) => t !== tld) : [...prev, tld]);
  };

  const checkAvailability = async () => {
    const suggestions = generateDomainSuggestions(partner1, partner2, selectedTlds);
    if (suggestions.length === 0) return;
    setChecking(true);
    setDomainResults(suggestions.map((d) => ({ domain: d, available: null, checking: true })));
    try {
      const { data, error } = await supabase.functions.invoke("check-domain", { body: { domains: suggestions } });
      if (error) throw error;
      if (data?.results) setDomainResults(data.results.map((r: DomainResult) => ({ ...r, checking: false })));
    } catch (err) {
      console.error("Domain check failed:", err);
      setDomainResults(suggestions.map((d) => ({ domain: d, available: null, checking: false })));
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!customDomain.includes(".") || customDomain.length < 4) { setCustomCheckResult(null); return; }
    const timer = setTimeout(async () => {
      setCheckingCustom(true);
      setCustomCheckResult({ domain: customDomain, available: null, checking: true });
      try {
        const { data, error } = await supabase.functions.invoke("check-domain", { body: { domains: [customDomain.trim().toLowerCase()] } });
        if (error) throw error;
        if (data?.results?.[0]) setCustomCheckResult({ ...data.results[0], checking: false });
      } catch { setCustomCheckResult({ domain: customDomain, available: null, checking: false }); }
      finally { setCheckingCustom(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [customDomain]);

  const handleSelectDomain = (domain: string) => {
    setSelectedDomain(domain);
    setCustomDomain(domain);
    setWizardStep(2);
  };

  const handleSaveDomain = async (domain: string) => {
    setSavingDomain(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { siteId, domain: domain.trim().toLowerCase(), action: "save" },
      });
      if (error) throw error;
      const d = domain.trim().toLowerCase();
      setCustomDomain(d);
      setSelectedDomain(d);
      onUpdate(d, "pending");
      setWizardStep(4);
      toast({ title: "Domain saved! 🔗", description: "Now let's verify your DNS records." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error saving domain", description: "Please try again.", variant: "destructive" });
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerify = async () => {
    const domain = savedDomain || selectedDomain;
    if (!domain) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { siteId, domain, action: "verify" },
      });
      if (error) throw error;
      onUpdate(domain, data.status);
      if (data.status === "verified" || data.status === "live") {
        toast({ title: "Domain verified! ✅", description: data.message });
        setWizardStep(5);
      } else {
        toast({ title: "DNS not ready yet", description: data.message });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Verification failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnect = async () => {
    if (!savedDomain) return;
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { siteId, domain: savedDomain, action: "disconnect" },
      });
      if (error) throw error;
      setCustomDomain("");
      setSelectedDomain("");
      onUpdate(null, "none");
      setWizardStep(1);
      toast({ title: "Domain disconnected" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error disconnecting", variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  const getBuyUrl = (domain: string, registrar: typeof DOMAIN_REGISTRARS[0]) => {
    if (registrar.name === "GoDaddy India") return `https://www.godaddy.com/en-in/domainsearch/find?domainToCheck=${domain}`;
    if (registrar.name === "BigRock") return `https://www.bigrock.in/domain-registration/index.php?domainname=${domain}`;
    if (registrar.name === "Hostinger India") return `https://www.hostinger.in/domain-name-search?query=${domain}`;
    return `https://www.namecheap.com/domains/registration/results/?domain=${domain}`;
  };

  const sortedResults = [...domainResults].sort((a, b) => {
    const order = (v: boolean | null) => (v === true ? 0 : v === null ? 1 : 2);
    return order(a.available) - order(b.available);
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const DNS_RECORDS = [
    { type: "A", name: "@", value: "185.158.133.1", desc: "Root domain" },
    { type: "A", name: "www", value: "185.158.133.1", desc: "WWW subdomain" },
  ];

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border/30 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            Custom Domain Wizard
            <span className="bg-gold/20 text-gold text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">PREMIUM</span>
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            {hasSavedDomain ? (
              <>Connected: <strong className="text-foreground">{savedDomain}</strong></>
            ) : (
              <>Follow the steps to get a memorable address like <strong>{partner1.toLowerCase()}and{partner2.toLowerCase()}.com</strong></>
            )}
          </p>
        </div>
        {hasSavedDomain && (
          <Button variant="outline" size="sm" className="font-body text-xs text-destructive hover:text-destructive shrink-0" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? "..." : <><X className="w-3.5 h-3.5 mr-1" /> Disconnect</>}
          </Button>
        )}
      </div>

      {/* Wizard Progress Bar */}
      <div className="px-4 sm:px-6 pt-5 pb-2">
        <div className="flex items-center justify-between relative">
          {/* connecting line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-border/50 z-0" />
          <div className="absolute top-4 left-0 h-0.5 bg-gold/70 z-0 transition-all duration-500" style={{ width: `${Math.min(100, ((Math.min(wizardStep, 4) - 1) / 3) * 100)}%` }} />
          
          {WIZARD_STEPS.map((step) => {
            const StepIcon = step.icon;
            const isComplete = wizardStep > step.id;
            const isCurrent = wizardStep === step.id;
            const isUpcoming = wizardStep < step.id;
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10" style={{ width: "25%" }}>
                <button
                  onClick={() => { if (isComplete || isCurrent) setWizardStep(step.id); }}
                  disabled={isUpcoming}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                    isComplete ? "bg-gold text-accent-foreground shadow-sm cursor-pointer" :
                    isCurrent ? "bg-gold/20 text-gold ring-2 ring-gold/40 cursor-default" :
                    "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                </button>
                <span className={`text-[10px] font-body font-medium text-center leading-tight ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* ─── Step 1: Find Domain ─── */}
        {wizardStep === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-muted/30 border border-border/30 rounded-xl p-4">
              <h3 className="font-display text-base font-semibold text-foreground mb-1">🔍 Find Your Perfect Domain</h3>
              <p className="text-xs text-muted-foreground font-body">
                Search for available domains or enter one you've already purchased.
              </p>
            </div>

            {/* AI suggestions */}
            <div className="space-y-3">
              <p className="font-body text-sm font-medium text-foreground">Select domain extensions:</p>
              <div className="flex flex-wrap gap-2">
                {WEDDING_TLDS.map((tld) => (
                  <button key={tld.ext} onClick={() => toggleTld(tld.ext)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-body transition-all ${
                      selectedTlds.includes(tld.ext)
                        ? "border-gold/50 bg-gold/10 text-foreground shadow-sm"
                        : "border-border/40 bg-muted/20 text-muted-foreground hover:border-border"
                    }`}
                  >
                    <span>{tld.emoji}</span>
                    <span className="font-semibold">{tld.ext}</span>
                    <span className="hidden sm:inline text-muted-foreground">· {tld.desc}</span>
                    {selectedTlds.includes(tld.ext) && <Check className="w-3 h-3 text-gold ml-1" />}
                  </button>
                ))}
              </div>

              <Button variant="gold" size="sm" className="font-body" onClick={checkAvailability} disabled={checking || !partner1 || !partner2 || selectedTlds.length === 0}>
                {checking ? <><span className="animate-spin mr-2">⏳</span> Checking...</> : <><Search className="w-4 h-4 mr-1" /> Find Available Domains</>}
              </Button>

              {sortedResults.length > 0 && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 mt-2">
                  {sortedResults.map(({ domain, available, checking: itemChecking }) => (
                    <div key={domain} className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 transition-all ${
                      available === true ? "border-emerald-500/30 bg-emerald-500/5"
                        : available === false ? "border-border/30 bg-muted/30 opacity-50"
                        : "border-border/40 bg-muted/20"
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {itemChecking ? <span className="w-4 h-4 animate-spin text-xs shrink-0">⏳</span>
                          : available === true ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          : available === false ? <X className="w-4 h-4 text-destructive shrink-0" />
                          : <Globe className="w-4 h-4 text-muted-foreground shrink-0" />}
                        <span className="font-body font-mono text-sm text-foreground truncate">{domain}</span>
                        {!itemChecking && available === true && (
                          <span className="text-[10px] font-body font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">Available</span>
                        )}
                      </div>
                      {!itemChecking && available !== false && (
                        <Button variant="gold" size="sm" className="text-[10px] h-7 px-3 font-body shrink-0" onClick={() => handleSelectDomain(domain)}>
                          Select →
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Own domain input */}
            <div className="border-t border-border/20 pt-4 space-y-3">
              <p className="font-body text-sm font-medium text-foreground">Already have a domain?</p>
              <div className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="e.g. arjunandmeera.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="pl-10 font-body font-mono text-sm" />
                  {checkingCustom && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs animate-spin">⏳</span>}
                </div>
                <Button variant="gold" size="sm" className="font-body shrink-0" onClick={() => { setSelectedDomain(customDomain); setWizardStep(3); }} disabled={!customDomain.includes(".") || customDomain.length < 4}>
                  Connect →
                </Button>
              </div>
              {customCheckResult && !customCheckResult.checking && (
                <div className={`flex items-center gap-2 text-xs font-body px-3 py-2 rounded-lg ${
                  customCheckResult.available === true ? "bg-emerald-500/10 text-emerald-600"
                    : customCheckResult.available === false ? "bg-muted/30 text-foreground"
                    : "bg-muted/30 text-muted-foreground"
                }`}>
                  {customCheckResult.available === true ? (
                    <><Check className="w-3.5 h-3.5" /> <strong>{customCheckResult.domain}</strong> appears available — purchase it first!</>
                  ) : customCheckResult.available === false ? (
                    <><Check className="w-3.5 h-3.5" /> <strong>{customCheckResult.domain}</strong> is registered — if you own it, click Connect</>
                  ) : (
                    <><Globe className="w-3.5 h-3.5" /> Could not determine status</>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Step 2: Purchase ─── */}
        {wizardStep === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
              <h3 className="font-display text-base font-semibold text-foreground mb-1">🛒 Purchase Your Domain</h3>
              <p className="text-xs text-muted-foreground font-body">
                Buy <strong className="text-foreground font-mono">{selectedDomain}</strong> from any registrar below. The process takes just 2–3 minutes.
              </p>
            </div>

            {/* Step-by-step purchase guide */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm font-body">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-medium text-foreground">Click a registrar below to open their site</p>
                  <p className="text-xs text-muted-foreground">Your domain will be pre-filled in the search</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm font-body">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-medium text-foreground">Add the domain to your cart & complete checkout</p>
                  <p className="text-xs text-muted-foreground">Skip any add-ons (hosting, email, etc.) — you only need the domain</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm font-body">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-medium text-foreground">Come back here & click "I've purchased it"</p>
                  <p className="text-xs text-muted-foreground">We'll guide you through connecting it to your wedding site</p>
                </div>
              </div>
            </div>

            {/* Registrar cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOMAIN_REGISTRARS.map((reg) => (
                <a key={reg.name} href={getBuyUrl(selectedDomain, reg)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 border border-border/40 rounded-xl p-4 hover:border-gold/40 hover:bg-gold/5 transition-all group"
                >
                  <span className="text-2xl">{reg.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-foreground group-hover:text-gold transition-colors">{reg.name}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{reg.payment}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-gold shrink-0" />
                </a>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" className="font-body" onClick={() => setWizardStep(1)}>
                ← Back
              </Button>
              <Button variant="gold" size="sm" className="font-body" onClick={() => setWizardStep(3)}>
                ✅ I've purchased it — Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 3: Configure DNS ─── */}
        {wizardStep === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <h3 className="font-display text-base font-semibold text-foreground mb-1">⚙️ Configure DNS Records</h3>
              <p className="text-xs text-muted-foreground font-body">
                Add these DNS records in your domain registrar's dashboard to point <strong className="text-foreground font-mono">{selectedDomain}</strong> to your wedding site.
              </p>
            </div>

            {/* Step-by-step DNS guide */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm font-body">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-medium text-foreground">Log in to your domain registrar</p>
                  <p className="text-xs text-muted-foreground">Go to the site where you purchased the domain (GoDaddy, BigRock, etc.)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm font-body">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-medium text-foreground">Navigate to DNS Management / DNS Settings</p>
                  <p className="text-xs text-muted-foreground">Usually under "My Domains" → Click your domain → "DNS" or "Manage DNS"</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm font-body">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-medium text-foreground">Add these records (delete any existing A records first):</p>
                </div>
              </div>
            </div>

            {/* DNS records table */}
            <div className="border border-border/50 rounded-xl overflow-hidden ml-9">
              <div className="grid grid-cols-[80px_1fr_1fr_60px] gap-2 px-4 py-2 bg-muted/40 text-[10px] font-body font-semibold uppercase text-muted-foreground">
                <span>Type</span>
                <span>Name / Host</span>
                <span>Value / Points to</span>
                <span>Copy</span>
              </div>
              {DNS_RECORDS.map((rec) => (
                <div key={rec.name} className="grid grid-cols-[80px_1fr_1fr_60px] gap-2 px-4 py-3 border-t border-border/30 items-center">
                  <span className="font-mono text-sm font-bold text-foreground">{rec.type}</span>
                  <div>
                    <span className="font-mono text-sm text-foreground">{rec.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">({rec.desc})</span>
                  </div>
                  <span className="font-mono text-sm text-foreground">{rec.value}</span>
                  <button onClick={() => copyToClipboard(rec.value, rec.name)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {copiedField === rec.name ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 ml-9">
              <p className="text-xs text-muted-foreground font-body">
                <strong className="text-amber-600">⏱ Note:</strong> DNS changes typically take 15 minutes to 72 hours to propagate worldwide. Most changes are live within 1–2 hours.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" className="font-body" onClick={() => setWizardStep(hasSavedDomain ? 1 : 2)}>
                ← Back
              </Button>
              <Button variant="gold" size="sm" className="font-body" onClick={() => { handleSaveDomain(selectedDomain); }} disabled={savingDomain || !selectedDomain}>
                {savingDomain ? <><span className="animate-spin mr-1">⏳</span> Saving...</> : <>Save & Verify →</>}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 4: Verify & Go Live ─── */}
        {wizardStep === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className={`border rounded-xl p-4 ${
              currentStatus === "verified" || currentStatus === "live"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5"
            }`}>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">
                {currentStatus === "verified" ? "✅ Domain Verified!" : "🔍 Verify Your Domain"}
              </h3>
              <p className="text-xs text-muted-foreground font-body">
                {currentStatus === "verified"
                  ? `Your domain ${savedDomain} is verified and SSL is being provisioned automatically. It will be live shortly!`
                  : `Click below to check if your DNS records for ${savedDomain || selectedDomain} are properly configured.`}
              </p>
            </div>

            {currentStatus === "pending" && (
              <div className="space-y-3">
                <p className="font-body text-sm text-muted-foreground">
                  If you just configured your DNS, it might take a few minutes. You can verify anytime.
                </p>
                <div className="bg-muted/30 border border-border/30 rounded-xl p-4 space-y-2">
                  <p className="font-body text-xs font-semibold text-foreground">Quick checklist before verifying:</p>
                  <div className="space-y-1.5 text-xs font-body text-muted-foreground">
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-gold" /> A record for <code className="bg-muted px-1 rounded">@</code> points to <code className="bg-muted px-1 rounded">185.158.133.1</code></p>
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-gold" /> A record for <code className="bg-muted px-1 rounded">www</code> points to <code className="bg-muted px-1 rounded">185.158.133.1</code></p>
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-gold" /> Old/conflicting A records removed</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="font-body" onClick={() => setWizardStep(3)}>
                ← DNS Instructions
              </Button>
              <Button variant="gold" size="sm" className="font-body" onClick={handleVerify} disabled={verifying}>
                {verifying ? <><span className="animate-spin mr-1">⏳</span> Verifying...</> : <><ShieldCheck className="w-4 h-4 mr-1" /> Verify DNS Now</>}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 5: Completed ─── */}
        {wizardStep === 5 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">Your domain is live! 🎉</h3>
              <p className="text-sm text-muted-foreground font-body mt-1">
                <strong className="text-foreground font-mono">{savedDomain}</strong> is connected to your wedding site.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="gold" size="sm" className="font-body" asChild>
                <a href={`https://${savedDomain}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" /> Visit {savedDomain}
                </a>
              </Button>
              <Button variant="outline" size="sm" className="font-body text-xs text-destructive hover:text-destructive" onClick={handleDisconnect} disabled={disconnecting}>
                Disconnect Domain
              </Button>
            </div>
          </motion.div>
        )}

        {/* Footer disclaimer */}
        <div className="border-t border-border/30 pt-4 mt-4">
          <p className="text-[10px] text-muted-foreground/70 font-body leading-relaxed">
            <strong className="text-muted-foreground">Important:</strong> Domain purchases are made directly through third-party registrars.
            We do not sell, manage, or renew domains. You are responsible for registration, renewal, and associated fees.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
