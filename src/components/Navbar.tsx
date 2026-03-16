import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import VowzLogo from "@/components/VowzLogo";
import { useAuth } from "@/hooks/use-auth";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const links = [
    { label: "Features", href: "#features" },
    { label: "Templates", href: "#templates" },
    { label: "Pricing", href: "/pricing", isRoute: true },
    { label: "FAQ", href: "#faq" },
    { label: "Domain Demo", href: "/domain-demo", isRoute: true },
    { label: "Blog", href: "/blog", isRoute: true },
    { label: "Affiliate", href: "/affiliate", isRoute: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <VowzLogo iconSize="h-7" textSize="text-lg" />
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) =>
            l.isRoute ? (
              <Link
                key={l.label}
                to={l.href}
                className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.label}
                href={l.href}
                className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {l.label}
              </a>
            )
          )}
          {!loading && (
            user ? (
              <Button variant="gold" size="sm" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Log In
                </Link>
                <Button variant="gold" size="sm" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border/30 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {links.map((l) =>
                l.isRoute ? (
                  <Link
                    key={l.label}
                    to={l.href}
                    className="font-body text-sm text-muted-foreground py-2"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.label}
                    href={l.href}
                    className="font-body text-sm text-muted-foreground py-2"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </a>
                )
              )}
              {!loading && (
                user ? (
                  <Button variant="gold" size="sm" className="mt-2" asChild>
                    <Link to="/dashboard" onClick={() => setOpen(false)}>
                      <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="font-body text-sm text-muted-foreground py-2"
                      onClick={() => setOpen(false)}
                    >
                      Log In
                    </Link>
                    <Button variant="gold" size="sm" className="mt-2" asChild>
                      <Link to="/auth" onClick={() => setOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
