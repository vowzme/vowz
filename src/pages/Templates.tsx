import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";

import { templates, TemplateData } from "@/components/TemplatesSection";

// Lazy-import the preview modal via dynamic rendering
// We'll inline a simpler version or re-use the component structure

const STYLE_FILTERS = ["All", "Traditional", "Regional", "Fusion", "Modern Glam", "Moody Luxe", "Destination", "Eco-Friendly", "Romantic", "Minimal", "Bohemian", "Grand"] as const;

function Eye(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const Templates = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || t.style.toLowerCase().includes(activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  // Get unique styles for filter
  const uniqueStyles = ["All", ...Array.from(new Set(templates.map(t => t.style)))];

  const handleUseTemplate = (t: TemplateData) => {
    const templateState = {
      templateName: t.name,
      templateStyle: t.style,
      templateColors: t.colors,
    };
    sessionStorage.setItem("pendingTemplate", JSON.stringify(templateState));
    navigate("/wizard", { state: templateState });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Wedding Invitation Templates – Vowz | 25+ Beautiful Designs"
        description="Browse 25+ stunning wedding invitation templates and themes. Traditional, modern, regional, and fusion styles — all mobile-responsive and free to start."
        ogTitle="Wedding Invitation Templates – Vowz | 25+ Beautiful Designs"
        ogDescription="Browse our collection of stunning wedding invitation templates. Traditional Indian, modern fusion, regional styles — all beautifully designed."
        ogImage="https://vowz.me/og-templates.jpg"
        ogUrl="https://vowz.me/templates"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Wedding Invitation Templates – 25+ Beautiful Designs"
        twitterDescription="Browse 25+ stunning wedding invitation templates. Traditional to modern, free to start."
        twitterImage="https://vowz.me/og-templates.jpg"
        canonical="https://vowz.me/templates"
      />
      <Navbar />
      
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-6 font-body text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Button>
            <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
              {templates.length} Stunning Templates
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Browse All <span className="text-gradient-gold italic">Templates</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              Find the perfect theme for your wedding — from traditional to modern, destination to minimal.
            </p>
          </motion.div>

          {/* Search & Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, style, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {uniqueStyles.map((style) => (
                <button
                  key={style}
                  onClick={() => setActiveFilter(style)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
                    activeFilter === style
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-center text-sm text-muted-foreground font-body mb-8">
            Showing {filteredTemplates.length} of {templates.length} templates
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
                className="group cursor-pointer"
                onClick={() => handleUseTemplate(t)}
              >
                <div className="relative rounded-xl overflow-hidden shadow-card hover:shadow-elegant transition-all duration-300 border border-border/50 hover:-translate-y-1">
                  <div className="h-60 relative">
                    <img src={t.heroPhoto} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${t.colors[0]}88 0%, ${t.colors[0]}cc 50%, ${t.colors[0]}ee 100%)` }} />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 mb-3 shadow-lg" style={{ borderColor: t.colors[1] }}>
                        <img src={t.couplePhoto} alt={t.couple} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <Heart className="w-3.5 h-3.5 mb-1.5" style={{ color: t.colors[1] }} fill="currentColor" />
                      <p className="font-display text-2xl font-bold drop-shadow-md" style={{ color: t.colors[2] }}>
                        {t.couple}
                      </p>
                      <p className="font-body text-xs mt-1 drop-shadow-sm" style={{ color: t.colors[2] + "cc" }}>
                        {t.weddingDate}
                      </p>
                      <p className="font-body text-[10px] mt-0.5 flex items-center gap-1 drop-shadow-sm" style={{ color: t.colors[2] + "99" }}>
                        <MapPin className="w-3 h-3" /> {t.location}
                      </p>
                    </div>

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full font-body text-sm font-medium flex items-center gap-2 border border-white/30">
                        <Eye className="w-4 h-4" /> Use Template
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-card flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground font-body">{t.style} • {t.events.length} events</p>
                    </div>
                    <div className="flex gap-1.5">
                      {t.colors.map((c, j) => (
                        <div key={j} className="w-5 h-5 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body">No templates match your search. Try a different term.</p>
            </div>
          )}
        </div>
      </section>

      
    </div>
  );
};

export default Templates;
