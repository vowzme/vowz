import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, LayoutDashboard, Sparkles, IndianRupee, Menu as MenuIcon,
  Users, Mail, BookOpen, Receipt, Bell, Heart, LifeBuoy, Info,
  LogIn, LogOut, ShieldCheck, Palette, Network,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/** Routes that render their own full-screen / immersive chrome. */
const HIDDEN_PREFIXES = [
  "/site/", "/share", "/editor", "/admin", "/wizard",
  "/invitation-card", "/showcase", "/debug", "/card-gallery",
];

type Item = { label: string; to: string; icon: typeof Home; match?: (p: string) => boolean };

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));

  // Reserve space so fixed footers / page content are never covered.
  useEffect(() => {
    const apply = () => {
      const small = window.innerWidth < 1024;
      document.body.style.paddingBottom = !hidden && small
        ? "calc(4.25rem + env(safe-area-inset-bottom))"
        : "";
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      document.body.style.paddingBottom = "";
    };
  }, [hidden]);

  useEffect(() => setOpen(false), [pathname]);

  if (hidden || loading) return null;

  const items: Item[] = user
    ? [
        { label: "Home", to: "/dashboard", icon: LayoutDashboard, match: (p) => p === "/dashboard" },
        { label: "Designs", to: "/themes", icon: Palette },
        { label: "Cards", to: "/card-templates-preview", icon: Mail },
        { label: "Billing", to: "/dashboard/payments", icon: Receipt },
      ]
    : [
        { label: "Home", to: "/", icon: Home, match: (p) => p === "/" },
        { label: "Designs", to: "/themes", icon: Palette },
        { label: "Pricing", to: "/pricing", icon: IndianRupee },
        { label: "Sign in", to: "/auth", icon: LogIn },
      ];

  const moreLinks = [
    ...(user
      ? [
          { label: "My dashboard", to: "/dashboard", icon: LayoutDashboard },
          { label: "Reminders", to: "/dashboard/reminders", icon: Bell },
          { label: "Payments", to: "/dashboard/payments", icon: Receipt },
        ]
      : [{ label: "Get started", to: "/auth", icon: LogIn }]),
    { label: "Templates", to: "/templates", icon: Heart },
    { label: "Card gallery", to: "/card-templates-preview", icon: Mail },
    { label: "Pricing", to: "/pricing", icon: IndianRupee },
    { label: "Blog", to: "/blog", icon: BookOpen },
    { label: "Affiliate", to: "/affiliate", icon: Users },
    { label: "Franchise", to: "/franchise", icon: Network },
    { label: "About us", to: "/about", icon: Info },
    { label: "Contact", to: "/contact", icon: LifeBuoy },
    { label: "Privacy", to: "/privacy", icon: ShieldCheck },
  ];

  const isActive = (i: Item) => (i.match ? i.match(pathname) : pathname.startsWith(i.to));

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/60 shadow-[0_-4px_20px_-8px_hsl(var(--foreground)/0.25)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary mobile navigation"
    >
      <ul className="grid grid-cols-5">
        {items.map((i) => {
          const active = isActive(i);
          return (
            <li key={i.label}>
              <Link
                to={i.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 font-body text-[11px] transition-colors",
                  active ? "text-accent font-semibold" : "text-muted-foreground",
                )}
              >
                <i.icon className={cn("w-5 h-5", active && "scale-110 transition-transform")} />
                {i.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="w-full flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 font-body text-[11px] text-muted-foreground"
                aria-label="More menu"
              >
                <MenuIcon className="w-5 h-5" />
                More
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader className="text-left">
                <SheetTitle className="font-display">Menu</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {moreLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-3 min-h-[80px] text-center font-body text-xs text-foreground"
                  >
                    <l.icon className="w-5 h-5 text-accent" />
                    {l.label}
                  </Link>
                ))}
              </div>
              {user && (
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-border/60 py-3 font-body text-sm text-muted-foreground min-h-[48px]"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              )}
              <div className="h-[env(safe-area-inset-bottom)]" />
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
