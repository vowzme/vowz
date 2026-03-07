import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Simple anonymous visitor ID (persists per browser session)
function getVisitorId(): string {
  let id = sessionStorage.getItem("ss_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("ss_visitor_id", id);
  }
  return id;
}

export function useAnalyticsTracker(siteId: string | undefined) {
  const trackedRef = useRef(false);

  const trackEvent = useCallback(
    async (eventType: string, metadata: Record<string, any> = {}) => {
      if (!siteId) return;
      try {
        await supabase.from("site_analytics" as any).insert({
          wedding_site_id: siteId,
          event_type: eventType,
          metadata,
          visitor_id: getVisitorId(),
        });
      } catch {
        // silently fail — analytics should never break the site
      }
    },
    [siteId]
  );

  const trackPageView = useCallback(() => {
    if (trackedRef.current || !siteId) return;
    trackedRef.current = true;
    trackEvent("page_view", {
      referrer: document.referrer || null,
      url: window.location.href,
    });
  }, [siteId, trackEvent]);

  return { trackEvent, trackPageView };
}

// Dashboard hook to read analytics
export function useSiteAnalytics(siteId: string | undefined) {
  const fetchAnalytics = useCallback(async () => {
    if (!siteId) return null;

    const { data: events, error } = await supabase
      .from("site_analytics" as any)
      .select("*")
      .eq("wedding_site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error || !events) return null;

    const rows = events as any[];
    const pageViews = rows.filter((e) => e.event_type === "page_view");
    const rsvps = rows.filter((e) => e.event_type === "rsvp_submit");
    const guestbookPosts = rows.filter((e) => e.event_type === "guestbook_post");

    // Unique visitors by visitor_id
    const uniqueVisitors = new Set(pageViews.map((e) => e.visitor_id)).size;

    // Views by day (last 30 days)
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const viewsByDay: Record<string, number> = {};
    pageViews
      .filter((e) => new Date(e.created_at) >= last30)
      .forEach((e) => {
        const day = new Date(e.created_at).toISOString().slice(0, 10);
        viewsByDay[day] = (viewsByDay[day] || 0) + 1;
      });

    // Convert to sorted array
    const dailyViews = Object.entries(viewsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, views]) => ({ date, views }));

    const conversionRate =
      pageViews.length > 0
        ? ((rsvps.length / uniqueVisitors) * 100).toFixed(1)
        : "0";

    return {
      totalPageViews: pageViews.length,
      uniqueVisitors,
      totalRsvps: rsvps.length,
      guestbookPosts: guestbookPosts.length,
      conversionRate,
      dailyViews,
      recentEvents: rows.slice(0, 20),
    };
  }, [siteId]);

  return { fetchAnalytics };
}
