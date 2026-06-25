import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Returns whether the current user has an active premium subscription. */
export function usePremiumStatus() {
  const { user, loading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) { setIsPremium(false); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("user_subscriptions")
      .select("plan,status,expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    const active = !!data &&
      (!data.expires_at || new Date(data.expires_at) > new Date()) &&
      ["premium", "premium_6mo", "premium_yearly"].includes(data.plan);
    setIsPremium(active);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  return { isPremium, loading, refresh };
}