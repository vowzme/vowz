import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mobile browsers may freeze WebSockets while the app is in the background.
 * Prompt the existing Realtime client to reconnect when the page becomes
 * usable again. Calling connect() is safe when its socket is already open.
 */
export default function RealtimeRecovery() {
  useEffect(() => {
    let reconnectTimer: number | undefined;

    const reconnect = () => {
      if (!navigator.onLine || document.visibilityState === "hidden") return;
      window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(() => {
        try {
          supabase.realtime.connect();
        } catch (error) {
          console.warn("[realtime:recovery] Reconnect deferred", error);
        }
      }, 250);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") reconnect();
    };

    window.addEventListener("online", reconnect);
    window.addEventListener("pageshow", reconnect);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(reconnectTimer);
      window.removeEventListener("online", reconnect);
      window.removeEventListener("pageshow", reconnect);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}