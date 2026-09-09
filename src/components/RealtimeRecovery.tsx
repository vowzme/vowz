import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getRealtimeHealth,
  setRealtimeHealth,
  subscribeRealtimeHealth,
} from "@/lib/realtime-health";

/**
 * Keeps the live-update stream healthy without ever interrupting the user.
 * Mobile browsers freeze WebSockets in the background, and flaky networks
 * drop them entirely; we silently reconnect on resume and retry with
 * exponential backoff while the stream is degraded.
 */
export default function RealtimeRecovery() {
  useEffect(() => {
    let reconnectTimer: number | undefined;
    let backoffTimer: number | undefined;
    let attempt = 0;
    let disposed = false;

    const tryConnect = () => {
      if (disposed) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (document.visibilityState === "hidden") return;
      try {
        supabase.realtime.connect();
      } catch (error) {
        console.warn("[realtime:recovery] Reconnect deferred", error);
      }
    };

    const reconnect = () => {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(tryConnect, 250);
    };

    const scheduleBackoff = () => {
      window.clearTimeout(backoffTimer);
      if (disposed || getRealtimeHealth() !== "degraded") return;
      const delay = Math.min(30000, 2000 * 2 ** attempt);
      attempt += 1;
      backoffTimer = window.setTimeout(() => {
        tryConnect();
        scheduleBackoff();
      }, delay);
    };

    const unsubscribe = subscribeRealtimeHealth((h) => {
      if (h === "degraded") {
        scheduleBackoff();
      } else {
        attempt = 0;
        window.clearTimeout(backoffTimer);
      }
    });

    if (getRealtimeHealth() === "degraded") scheduleBackoff();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") reconnect();
    };
    const handleOffline = () => setRealtimeHealth("degraded");

    window.addEventListener("online", reconnect);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pageshow", reconnect);
    window.addEventListener("focus", reconnect);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      unsubscribe();
      window.clearTimeout(reconnectTimer);
      window.clearTimeout(backoffTimer);
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pageshow", reconnect);
      window.removeEventListener("focus", reconnect);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
