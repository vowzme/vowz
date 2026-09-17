import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, Copy, MessageCircle, EyeOff, Eye, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useLuxeAccess } from "@/hooks/use-luxe-access";
import { useWeddingSite } from "@/hooks/use-wedding-site";
import { toast } from "@/hooks/use-toast";
import BuyLuxeButton from "@/components/BuyLuxeButton";
import { WEDDING_THEMES } from "@/lib/wedding-themes";
import { ThemeDemo } from "@/components/ThemeDemo";
import { LazyOnVisible } from "@/components/LazyOnVisible";
import { LUXE_TEMPLATES } from "@/lib/card-templates";

const LUXE_THEMES = WEDDING_THEMES.filter((t) => t.tier === "luxe");

interface ShareRow {
  id: string;
  name: string;
  template_slug: string;
  share_token: string;
  share_enabled: boolean;
  wedding_site_id: string;
}

export default function LuxeDashboard() {
  const { user } = useAuth();
  const { hasLuxe, loading, refresh } = useLuxeAccess();
  const { loadUserSite, updateSite } = useWeddingSite();
  const navigate = useNavigate();
  const [unlock, setUnlock] = useState<any>(null);
  const [cards, setCards] = useState<ShareRow[]>([]);
  const [applying, setApplying] = useState<string | null>(null);

  const loadCards = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("invitation_card_variants")
      .select("id,name,template_slug,share_token,share_enabled,wedding_site_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setCards((data ?? []) as ShareRow[]);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("user_luxe_unlocks")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      setUnlock(data);
      await loadCards();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasLuxe]);

  const applyTheme = async (themeId: string) => {
    setApplying(themeId);
    try {
      const site = await loadUserSite();
      if (!site) {
        toast({ title: "Create your site first", description: "Finish the wizard, then apply a LUXE design." });
        navigate("/wizard");
        return;
      }
      const t = LUXE_THEMES.find((x) => x.id === themeId);
      if (!t) {
        toast({ title: "Design unavailable", variant: "destructive" });
        return;
      }
      const ok = await updateSite((site as any).id, {
        theme: t.id,
        suggested_colors: [t.colors.bg, t.colors.accent, t.colors.surface],
      });
      if (ok) {
        toast({ title: "Design applied", description: `${t.name} is now your website design.` });
        navigate(`/editor/${(site as any).id}`);
      }
    } finally {
      setApplying(null);
    }
  };

  const shareUrl = (token: string) => `${window.location.origin}/card/${token}`;

  const toggleShare = async (c: ShareRow) => {
    const { error } = await (supabase as any)
      .from("invitation_card_variants")
      .update({ share_enabled: !c.share_enabled })
      .eq("id", c.id);
    if (error) {
      toast({ title: "Could not update the link", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: c.share_enabled ? "Guest link turned off" : "Guest link is live" });
    loadCards();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 pb-28">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-6 h-6 text-gold" />
          <h1 className="font-display text-3xl font-bold text-foreground">Your LUXE collection</h1>
        </div>
        <p className="font-body text-muted-foreground mb-8">
          Exclusive wedding website designs and opening-reveal invitation cards.
        </p>

        {!hasLuxe ? (
          <div className="rounded-2xl border-2 border-gold/40 bg-gold/5 p-8 text-center">
            <Crown className="w-8 h-8 text-gold mx-auto mb-3" />
            <h2 className="font-display text-xl font-bold mb-2">LUXE isn’t unlocked yet</h2>
            <p className="font-body text-sm text-muted-foreground max-w-md mx-auto mb-5">
               One payment, yours for life — {LUXE_THEMES.length} exclusive website designs and four invitation cards
              that open with a rope pull, a bell, a wax seal or a velvet curtain.
            </p>
            <div className="flex justify-center">
              <BuyLuxeButton onPurchased={refresh} />
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 mb-10 flex flex-wrap items-center justify-between gap-2">
              <p className="font-body text-sm text-foreground flex items-center gap-2">
                <Crown className="w-4 h-4 text-gold" /> LUXE unlocked
                {unlock?.purchased_at && (
                  <span className="text-muted-foreground">
                    · {new Date(unlock.purchased_at).toLocaleDateString()}
                  </span>
                )}
              </p>
              {unlock?.amount_paid ? (
                <span className="font-body text-xs text-muted-foreground">
                  {unlock.currency === "INR" ? "₹" : "$"}
                  {Number(unlock.amount_paid).toLocaleString()} one-time
                </span>
              ) : (
                <span className="font-body text-xs text-muted-foreground">Complimentary access</span>
              )}
            </div>

            <h2 className="font-display text-xl font-bold mb-4">LUXE website designs</h2>
             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
               {LUXE_THEMES.slice(0, 12).map((t) => (
                <div key={t.id} className="rounded-2xl">
                  <LazyOnVisible
                    minHeight={200}
                    fallback={<div aria-hidden className="w-full rounded-xl animate-pulse" style={{ height: 200, background: t.colors.surface }} />}
                  >
                    <ThemeDemo theme={t} compact />
                  </LazyOnVisible>
                  <h3 className="font-display text-lg font-semibold mt-3">{t.name}</h3>
                  <p className="font-body text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    disabled={applying === t.id}
                    onClick={() => applyTheme(t.id)}
                  >
                    {applying === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Apply to my site
                  </Button>
                </div>
              ))}
            </div>

            {LUXE_THEMES.length > 12 && (
              <div className="-mt-6 mb-12 text-center">
                <Button variant="outline" asChild>
                  <Link to="/themes#luxe">Browse all {LUXE_THEMES.length} LUXE designs</Link>
                </Button>
              </div>
            )}

            <h2 className="font-display text-xl font-bold mb-4">Opening-reveal invitation cards</h2>
            <div className="grid sm:grid-cols-2 gap-3 mb-12">
              {LUXE_TEMPLATES.map((tpl: any) => (
                <div key={tpl.slug} className="rounded-xl border border-border/60 p-4">
                  <p className="font-display font-semibold text-foreground">{tpl.name}</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">{tpl.description ?? "LUXE opening reveal"}</p>
                </div>
              ))}
            </div>

            <h2 className="font-display text-xl font-bold mb-4">Guest links</h2>
            {cards.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">
                You haven’t saved an invitation card yet.{" "}
                <Link to="/dashboard" className="text-gold hover:underline">Go to your dashboard</Link> to make one.
              </p>
            ) : (
              <div className="space-y-3">
                {cards.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border/60 p-4 flex flex-wrap items-center gap-3 justify-between">
                    <div className="min-w-0">
                      <p className="font-body font-medium text-foreground truncate">{c.name || c.template_slug}</p>
                      <p className="font-body text-xs text-muted-foreground truncate">
                        {c.share_enabled ? shareUrl(c.share_token) : "Sharing is off"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.share_enabled && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => {
                            navigator.clipboard.writeText(shareUrl(c.share_token));
                            toast({ title: "Link copied" });
                          }}>
                            <Copy className="w-4 h-4" /> Copy
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`You're invited 💍 ${shareUrl(c.share_token)}`)}`}
                              target="_blank" rel="noreferrer"
                            >
                              <MessageCircle className="w-4 h-4" /> WhatsApp
                            </a>
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => toggleShare(c)}>
                        {c.share_enabled ? <><EyeOff className="w-4 h-4" /> Turn off</> : <><Eye className="w-4 h-4" /> Turn on</>}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
