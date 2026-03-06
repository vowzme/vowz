import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Edit3, Eye, ExternalLink, Globe, GlobeLock,
  Users, Calendar, Mail, ChevronDown, ChevronUp,
  Settings, LogOut, Sparkles, Plus, Check, X, Copy,
  User, MapPin, Utensils, PartyPopper, Clock, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useWeddingSite } from "@/hooks/use-wedding-site";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
            <span className="font-display text-lg font-semibold text-foreground">ShaadiSite</span>
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
            <TabsList className="bg-card border border-border/50">
              <TabsTrigger value="overview" className="font-body">Overview</TabsTrigger>
              <TabsTrigger value="rsvps" className="font-body">
                RSVPs {rsvps.length > 0 && <span className="ml-1.5 bg-gold/20 text-gold text-xs px-1.5 py-0.5 rounded-full">{rsvps.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="settings" className="font-body">Settings</TabsTrigger>
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
                <div className="bg-card border border-border/50 rounded-2xl p-6">
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
    <div className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
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
          <p className="font-body text-xs text-muted-foreground">{rsvp.guest_email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rsvp.attending && (
            <span className="font-body text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {rsvp.guest_count} guest{rsvp.guest_count > 1 ? "s" : ""}
            </span>
          )}
          <span className="font-body text-xs text-muted-foreground">
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

export default Dashboard;
