import { Facebook, Instagram, MessageCircle, Twitter } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import VowzLogo from "@/components/VowzLogo";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const socialLinks = [
    { label: "Facebook", href: "https://www.facebook.com/VowZonline", icon: Facebook },
    { label: "Instagram", href: "https://www.instagram.com/vowzonline/", icon: Instagram },
    { label: "X", href: "https://x.com/VowZonline", icon: Twitter },
    { label: "WhatsApp", href: "https://wa.me/917994410111", icon: MessageCircle },
  ];

  const scrollToHash = (hash: string, attempt = 0) => {
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    // Home page sections load lazily — retry briefly until the section mounts.
    if (attempt < 20) setTimeout(() => scrollToHash(hash, attempt + 1), 150);
  };

  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const hash = href.slice(href.indexOf("#"));
    if (location.pathname === "/") {
      scrollToHash(hash);
    } else {
      navigate("/");
      setTimeout(() => scrollToHash(hash), 150);
    }
  };

  return (
    <footer className="border-t border-border/50 py-8 sm:py-12 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <div className="mb-3">
              <VowzLogo iconSize="h-8" textSize="text-xl" />
            </div>
            <p className="text-muted-foreground font-body text-sm">
              A product of <strong className="text-foreground">AXPIR Tech India LLP</strong>. Where Vows Come Alive.
            </p>
            <div className="mt-4 flex flex-wrap gap-3" aria-label="Social media links">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-secondary text-muted-foreground transition-colors hover:text-accent"
                >
                  <item.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {[
            { title: "Product", links: [
              { label: "Templates", href: "/templates" },
              { label: "Features", href: "/#features" },
              { label: "Pricing", href: "/#pricing" },
              { label: "Blog", href: "/blog" },
              { label: "Create Site", href: "/auth" },
            ]},
            { title: "Company", links: [
              { label: "About Us", href: "/about" },
              { label: "Contact Us", href: "/contact" },
              { label: "Join as Affiliate", href: "/affiliate" },
              { label: "Franchise Partner", href: "/franchise" },
            ]},
            { title: "Legal", links: [
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Refund Policy", href: "/refund-policy" },
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
                      <a href={link.href} onClick={(e) => handleAnchorClick(e, link.href)} className="text-muted-foreground hover:text-foreground font-body text-sm transition-colors cursor-pointer">
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
            © 2026 AXPIR TECH · VowZ (vowz.me). Crafted with love 💍
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
