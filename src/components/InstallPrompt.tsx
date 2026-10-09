import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import InstallAppPanel from "@/components/InstallAppPanel";
import { canPromptInstall, isInIframe, isIOS, isStandalone, subscribeInstall } from "@/lib/pwa-install";

const KEY = "vowz_install_dismissed_at";

/** Small bottom card offering to install the app, shown when the browser allows it. */
export default function InstallPrompt() {
  const { pathname } = useLocation();
  const [, force] = useState(0);
  const [hidden, setHidden] = useState(() => {
    const t = Number(localStorage.getItem(KEY) || 0);
    return Date.now() - t < 14 * 86400000;
  });
  useEffect(() => subscribeInstall(() => force((n) => n + 1)), []);
  const blocked = pathname.startsWith("/site/") || pathname.startsWith("/admin") || pathname.startsWith("/card/") || pathname === "/install";
  if (hidden || blocked || isStandalone() || isInIframe() || !(canPromptInstall() || isIOS())) return null;
  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:w-96 z-50 rounded-xl border bg-card shadow-lg p-4">
      <button aria-label="Close" className="absolute top-2 right-2 text-muted-foreground" onClick={() => { localStorage.setItem(KEY, String(Date.now())); setHidden(true); }}>
        <X className="h-4 w-4" />
      </button>
      <div className="font-display font-bold mb-1">Get the Vowz app</div>
      <p className="text-xs text-muted-foreground mb-3">Faster access to your wedding site, guests and RSVPs from your home screen.</p>
      <InstallAppPanel compact />
    </div>
  );
}
