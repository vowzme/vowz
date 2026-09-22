import { Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import VowzLogo from "@/components/VowzLogo";
import { useAuth } from "@/hooks/use-auth";
import NotificationsBell from "@/components/NotificationsBell";

const Navbar = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { label: "Features", href: "/#features" },
    { label: "Templates", href: "/#templates" },
    { label: "Themes", href: "/themes", isRoute: true },
    { label: "Pricing", href: "/pricing", isRoute: true },
    { label: "FAQ", href: "/#faq" },
    { label: "Vendors", href: "/vendors", isRoute: true },
    { label: "Blog", href: "/blog", isRoute: true },
    { label: "Affiliate", href: "/affiliate", isRoute: true },
  ];

  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const hash = href.replace("/", "");
    if (location.pathname === "/") {
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const el = document.querySelector(hash);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/30" role="navigation" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Vowz — Home">
          <VowzLogo iconSize="h-7" textSize="text-lg" />
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-6">
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
                onClick={(e) => handleAnchorClick(e, l.href)}
                className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
              >
                {l.label}
              </a>
            )
          )}
          {!loading && (
            user ? (
              <>
                <NotificationsBell />
                <Button variant="gold" size="sm" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
                  </Link>
                </Button>
              </>
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

        {/* Mobile / tablet quick actions — full menu lives in the bottom bar */}
        <div className="flex lg:hidden items-center gap-2">
          {!loading && (
            user ? (
              <>
                <NotificationsBell />
                <Button variant="gold" size="sm" asChild>
                  <Link to="/dashboard" aria-label="Go to dashboard">
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
                  </Link>
                </Button>
              </>
            ) : (
              <Button variant="gold" size="sm" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            )
          )}
        </div>
      </div>

    </nav>
  );
};

export default Navbar;
