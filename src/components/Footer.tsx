import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-8 sm:py-12 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-gold" fill="currentColor" />
              <span className="font-display text-xl font-bold text-foreground">ShaadiSite</span>
            </div>
            <p className="text-muted-foreground font-body text-sm">
              Beautiful Indian wedding websites, made simple.
            </p>
          </div>
          {[
            { title: "Product", links: [
              { label: "Templates", href: "/templates" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "AI Wizard", href: "/wizard" },
            ]},
            { title: "Support", links: [
              { label: "Help Center", href: "#" },
              { label: "Contact Us", href: "#" },
              { label: "Privacy Policy", href: "#" },
              { label: "Terms", href: "#" },
            ]},
            { title: "Company", links: [
              { label: "About", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Join as Affiliate", href: "/affiliate" },
              { label: "Careers", href: "#" },
            ]},
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-foreground mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link to={link.href} className="text-muted-foreground hover:text-foreground font-body text-sm transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-muted-foreground hover:text-foreground font-body text-sm transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 pt-6 text-center">
          <p className="text-xs text-muted-foreground font-body">
            © 2026 ShaadiSite. Made with love in Kerala 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
