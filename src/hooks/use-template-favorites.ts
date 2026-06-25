import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const LOCAL_KEY = "vowz.cardGallery.favorites";
const MIGRATED_KEY = "vowz.cardGallery.favorites.migratedFor";

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
      // Push any local-only entries up so they follow the user. Use upsert on
      // the (user_id, template_slug) unique constraint to be duplicate-proof.
      const toInsert = Array.from(new Set(local)).filter((s) => !cloud.includes(s));
      let migratedCount = 0;
      if (toInsert.length) {
        const { error } = await (supabase as any).from("template_favorites").upsert(
          toInsert.map((slug) => ({ user_id: user.id, template_slug: slug })),
          { onConflict: "user_id,template_slug", ignoreDuplicates: true },
        );
        if (!error) migratedCount = toInsert.length;
      }
      // One-time post-login migration toast (per user).
      try {
        const already = localStorage.getItem(MIGRATED_KEY);
        if (already !== user.id) {
          if (migratedCount > 0) {
            toast({
              title: "Favorites synced",
              description: `${migratedCount} local favorite${migratedCount === 1 ? "" : "s"} moved to your account.`,
            });
          }
          localStorage.setItem(MIGRATED_KEY, user.id);
        }
      } catch {}
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