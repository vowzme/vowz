import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "917994410111";

/** Floating WhatsApp help button shown on every platform page. */
const HIDDEN_PREFIXES = ["/site/", "/editor", "/invitation-card", "/share", "/card-gallery", "/card-templates-preview", "/debug"];

export default function WhatsAppSupport() {
  const { pathname } = useLocation();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const text = encodeURIComponent(
    `Hi Vowz team, I need help with my wedding website. (Page: ${typeof window !== "undefined" ? window.location.href : "/"})`,
  );

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Vowz support on WhatsApp"
      className="fixed right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 active:scale-95"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden text-sm font-medium sm:inline">Chat with us</span>
    </a>
  );
}
