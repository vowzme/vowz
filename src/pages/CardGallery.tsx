import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import {
  FALLBACK_TEMPLATES,
  CARD_THEMES,
  TEMPLATE_FACETS,
  CATEGORY_LABELS,
  InvitationCardArtwork,
  type CardCategory,
} from "@/lib/card-templates";

const DEMO_DATA = {
  partner1: "Aanya",
  partner2: "Rohan",
  date: "Saturday, 14 February 2026",
  time: "6:00 PM onwards",
  venue: "The Leela Palace, Udaipur",
  invitationLine: "Together with their families",
  message: "Two souls, one journey — join us as we say I do.",
};

const CATEGORIES: { value: "all" | CardCategory; label: string }[] = [
  { value: "all", label: "All Designs" },
  { value: "hindu_sikh", label: CATEGORY_LABELS.hindu_sikh },
  { value: "christian_muslim", label: CATEGORY_LABELS.christian_muslim },
  { value: "modern_minimal", label: CATEGORY_LABELS.modern_minimal },
  { value: "royal_traditional", label: CATEGORY_LABELS.royal_traditional },
];

export default function CardGallery() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | CardCategory>("all");
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FALLBACK_TEMPLATES.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (tier === "free" && t.is_premium) return false;
      if (tier === "premium" && !t.is_premium) return false;
      if (!q) return true;
      const facets = TEMPLATE_FACETS[t.slug];
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (facets?.tags ?? []).some((tag) => tag.includes(q))
      );
    });
  }, [query, category, tier]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Premium Wedding Invitation Card Templates – Vowz"
        description="Browse 30+ premium, fully editable wedding invitation card templates — Hindu, Sikh, Christian, Muslim, modern minimal and royal traditional designs."
        canonical="https://vowz.me/card-gallery"
        robots="index, follow"
      />
      <Navbar />
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 font-body text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Button>
          <div className="text-center mb-10">
            <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
              {FALLBACK_TEMPLATES.length} Premium Card Designs
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
              Invitation <span className="text-gradient-gold italic">Card Gallery</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto font-body">
              Fully editable, print-ready wedding invitation cards. Pick a design and customize every detail from your dashboard.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-center mb-6 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by style, color, or theme..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-body"
            >
              <option value="all">All tiers</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
                  category === c.value
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground font-body mb-6">
            Showing {visible.length} of {FALLBACK_TEMPLATES.length} designs
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visible.map((t) => {
              const theme = CARD_THEMES[t.slug];
              if (!theme) return null;
              return (
                <div
                  key={t.slug}
                  className="group rounded-xl overflow-hidden border border-border/50 bg-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative bg-muted/30 h-[360px] overflow-hidden flex items-start justify-center pt-4">
                    <div
                      style={{
                        transform: "scale(0.5)",
                        transformOrigin: "top center",
                        pointerEvents: "none",
                      }}
                    >
                      <InvitationCardArtwork data={DEMO_DATA} theme={theme} width={420} />
                    </div>
                    {t.is_premium && (
                      <Badge className="absolute top-3 right-3 bg-gold/90 text-background border-0 text-[10px] gap-1">
                        <Lock className="w-2.5 h-2.5" /> Premium
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-display text-base font-semibold text-foreground truncate">{t.name}</h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {CATEGORY_LABELS[t.category]}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground font-body line-clamp-2 mb-3">{t.description}</p>
                    )}
                    <Button asChild size="sm" className="w-full" variant="outline">
                      <Link to="/dashboard">Use this design</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {visible.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body">No designs match your filters.</p>
            </div>
          )}

          <div className="text-center mt-16 p-8 rounded-2xl bg-gradient-to-br from-gold/10 via-background to-accent/10 border border-border/50">
            <h2 className="font-display text-2xl font-semibold mb-2">Ready to customize?</h2>
            <p className="text-muted-foreground font-body mb-5 max-w-lg mx-auto">
              Open your dashboard, pick a wedding site, and tap “Invitation Card” to start editing any of these designs.
            </p>
            <Button asChild size="lg">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}