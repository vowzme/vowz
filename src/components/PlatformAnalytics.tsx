import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPlatformEvent } from "@/lib/platform-analytics";

/** Records one anonymous visit per page of the main platform. */
export default function PlatformAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    // Guest wedding sites have their own per-site tracking; admin screens are
    // internal, so neither belongs in the visitor funnel.
    if (path.startsWith("/site/") || path.startsWith("/admin")) return;
    trackPlatformEvent("page_view", { path, dedupeKey: `pv:${path}${location.search}` });
  }, [location.pathname, location.search]);

  return null;
}
