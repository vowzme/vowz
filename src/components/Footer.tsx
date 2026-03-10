import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import VowzLogo from "@/components/VowzLogo";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-8 sm:py-12 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <div className="mb-3">
              <VowzLogo iconSize="h-8" textSize="text-xl" />
            </div>
            <p className="text-muted-foreground font-body text-sm">
              Where Vows Come Alive. Beautiful wedding websites, made simple.
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
              { label: "Contact Us", href: "/contact" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
            ]},
            { title: "Company", links: [
              { label: "Join as Affiliate", href: "/affiliate" },
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
            © 2026 Vowz (vowz.co). Crafted with love 💍
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
