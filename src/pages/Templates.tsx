import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";

import { templates, TemplateData, TemplatePreviewModal } from "@/components/TemplatesSection";
import { TemplateTileArt, getTemplateRecipeLabel } from "@/lib/template-layouts";

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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

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
        title={`${templates.length} Wedding Website Templates – Vowz`}
        description={`Browse ${templates.length} premium wedding website templates with unique mobile-friendly layouts, realistic demo content, and editable styles.`}
        ogTitle={`${templates.length} Wedding Website Templates – Vowz`}
        ogDescription="Browse our collection of stunning wedding invitation templates. Traditional Indian, modern fusion, regional styles — all beautifully designed."
        ogImage="https://vowz.me/og-templates.jpg"
        ogUrl="https://vowz.me/templates"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle={`${templates.length} Premium Wedding Website Templates`}
        twitterDescription={`Browse ${templates.length} unique, mobile-friendly wedding website templates. Traditional to modern, free to start.`}
        twitterImage="https://vowz.me/og-templates.jpg"
        canonical="https://vowz.me/templates"
        robots="index, follow"
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
                aria-label="Search templates by name, style, or location"
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
                  aria-pressed={activeFilter === style}
                  aria-label={`Filter templates by ${style} style`}
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
            {filteredTemplates.map((t, i) => {
              const designIndex = templates.indexOf(t);
              const recipeLabel = getTemplateRecipeLabel(t.name, designIndex);
              return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="group cursor-pointer"
                onClick={() => setSelectedTemplate(t)}
                role="button"
                tabIndex={0}
                aria-label={`Preview the ${t.name} wedding template — ${t.style} style`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedTemplate(t);
                  }
                }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-elegant transition-all duration-300 border border-gold/20 hover:border-gold/60 hover:-translate-y-1 bg-card">
                  <div className="h-64 sm:h-60 relative">
                    <TemplateTileArt t={t} designIndex={designIndex} />

                    <span className="absolute top-2 left-2 z-10 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-1 text-[10px] font-body tracking-wide text-white border border-white/20">
                      {recipeLabel}
                    </span>

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full font-body text-sm font-medium flex items-center gap-2 border border-white/30">
                        <Eye className="w-4 h-4" /> Preview Template
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">{t.name}</h3>
                        <p className="text-xs text-muted-foreground font-body">{t.style} • {recipeLabel}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {t.colors.map((c, j) => (
                          <div key={j} className="w-5 h-5 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 font-body h-11 sm:h-9"
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplate(t); }}
                        aria-label={`Preview the ${t.name} template with demo content`}
                      >
                        <Eye className="w-4 h-4 mr-1.5" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 font-body h-11 sm:h-9"
                        onClick={(e) => { e.stopPropagation(); handleUseTemplate(t); }}
                        aria-label={`Use the ${t.name} template`}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body">No templates match your search. Try a different term.</p>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedTemplate && (
          <TemplatePreviewModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onUseTemplate={(t) => { setSelectedTemplate(null); handleUseTemplate(t); }}
          />
        )}
      </AnimatePresence>
      

      
    </div>
  );
};

export default Templates;
