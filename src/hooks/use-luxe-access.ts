import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Whether the signed-in user has unlocked the LUXE invitation-card tier. */
export function useLuxeAccess() {
  const { user, loading: authLoading } = useAuth();
  const [hasLuxe, setHasLuxe] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setHasLuxe(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("user_luxe_unlocks")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);
    setHasLuxe(Array.isArray(data) && data.length > 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return { hasLuxe, loading, refresh };
}
