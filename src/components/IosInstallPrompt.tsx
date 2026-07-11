import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";

/**
 * iOS-only "Add to Home Screen" hint.
 *
 * iOS Safari has no beforeinstallprompt event, so we show a small banner
 * with the exact tap sequence. Dismissed state is stored in localStorage.
 * Hidden automatically when the app is already running standalone.
 */
const KEY = "vowz-ios-install-dismissed";

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIphoneIpad = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  const isIpadOs = ua.includes("Mac") && "ontouchend" in document;
  return isIphoneIpad || isIpadOs;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS-specific standalone flag
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function IosInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY) === "1") return;
    if (!isIos() || isStandalone()) return;
    // Show after 4s so it doesn't block first paint
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Vowz on your Home Screen"
      className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border bg-background/95 backdrop-blur shadow-elegant p-4 flex gap-3 items-start md:hidden"
    >
      <img src="/icons/apple-touch-icon-180.png" alt="" className="h-12 w-12 rounded-xl border border-border" />
      <div className="flex-1 text-sm">
        <p className="font-medium">Install Vowz on your iPhone</p>
        <p className="opacity-80 mt-1">
          Tap <Share className="inline h-4 w-4 align-text-bottom" /> <b>Share</b> then <b>Add to Home Screen</b>.
        </p>
      </div>
      <button
        aria-label="Dismiss install prompt"
        className="p-1 -m-1 opacity-70 hover:opacity-100"
        onClick={() => {
          localStorage.setItem(KEY, "1");
          setVisible(false);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}