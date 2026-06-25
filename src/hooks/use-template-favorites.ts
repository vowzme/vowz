import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const LOCAL_KEY = "vowz.cardGallery.favorites";

const loadLocal = (): string[] => {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
};
const saveLocal = (slugs: string[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(slugs)); } catch {}
};

/**
 * Favorites sync to Supabase when signed in (follows user across devices),
 * and fall back to localStorage when signed out. On sign-in, any local
 * favorites are merged into the cloud row set.
 */
export function useTemplateFavorites() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(() => loadLocal());
  const [ready, setReady] = useState(false);

  // Load + merge on auth change
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      if (!user) {
        setFavorites(loadLocal());
        setReady(true);
        return;
      }
      const { data } = await (supabase as any)
        .from("template_favorites").select("template_slug").eq("user_id", user.id);
      const cloud: string[] = (data ?? []).map((r: any) => r.template_slug);
      const local = loadLocal();
      const merged = Array.from(new Set([...cloud, ...local]));
      // Push any local-only entries up so they follow the user
      const toInsert = local.filter((s) => !cloud.includes(s));
      if (toInsert.length) {
        await (supabase as any).from("template_favorites").insert(
          toInsert.map((slug) => ({ user_id: user.id, template_slug: slug })),
        );
      }
      if (!cancelled) {
        setFavorites(merged);
        saveLocal(merged); // keep local mirror for offline
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const toggle = useCallback(async (slug: string) => {
    setFavorites((prev) => {
      const has = prev.includes(slug);
      const next = has ? prev.filter((s) => s !== slug) : [...prev, slug];
      saveLocal(next);
      return next;
    });
    if (!user) return;
    const has = favorites.includes(slug);
    if (has) {
      await (supabase as any).from("template_favorites")
        .delete().eq("user_id", user.id).eq("template_slug", slug);
    } else {
      await (supabase as any).from("template_favorites")
        .insert({ user_id: user.id, template_slug: slug });
    }
  }, [user, favorites]);

  return { favorites, toggle, ready };
}