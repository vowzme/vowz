import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

// Safe fallbacks — used whenever the wizard/editor hasn't captured a theme or
// palette yet so we never persist blank/short arrays that break the renderer.
export const DEFAULT_THEME = "modern-minimal";
export const DEFAULT_COLORS: [string, string, string] = ["#6B1D2A", "#D4A853", "#FFF5E6"];
export const DEFAULT_DISPLAY_FONT = "Cormorant Garamond";
export const DEFAULT_BODY_FONT = "Inter";

export const sanitizeColors = (colors?: string[] | null): string[] => {
  const clean = (colors || []).filter((c) => typeof c === "string" && /^#?[0-9a-fA-F]{3,8}$/.test(c.trim()));
  if (clean.length >= 3) return clean.slice(0, 5);
  return [...clean, ...DEFAULT_COLORS.slice(clean.length)];
};

// Resolve the theme id to use when the caller may have passed empty/whitespace.
export const resolveTheme = (theme?: string | null): string =>
  (theme || "").trim() || DEFAULT_THEME;

export interface WeddingSiteRow {
  id: string;
  user_id: string;
  partner1: string;
  partner2: string;
  cultural_background: string;
  how_we_met: string;
  theme: string;
  tagline: string;
  suggested_colors: string[];
  sections: any[];
  is_published: boolean;
  slug: string | null;
  display_font: string | null;
  body_font: string | null;
  created_at: string;
  updated_at: string;
}

export function useWeddingSite() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const createSite = useCallback(
    async (data: {
      partner1: string;
      partner2: string;
      culturalBackground: string;
      howWeMet: string;
      theme: string;
      tagline: string;
      suggestedColors: string[];
      sections: any[];
      displayFont?: string;
      bodyFont?: string;
    }) => {
      if (!user) return null;
      setSaving(true);
      try {
        const p1 = (data.partner1 || "partner1").trim() || "partner1";
        const p2 = (data.partner2 || "partner2").trim() || "partner2";
        const safeColors = sanitizeColors(data.suggestedColors);
        const safeTheme = (data.theme || "").trim() || DEFAULT_THEME;
        const safeDisplayFont = data.displayFont || DEFAULT_DISPLAY_FONT;
        const safeBodyFont = data.bodyFont || DEFAULT_BODY_FONT;
        const slug = `${p1.toLowerCase().replace(/\s+/g, "-")}-${p2.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;
        const { data: site, error } = await supabase
          .from("wedding_sites")
          .insert({
            user_id: user.id,
            partner1: data.partner1 || "",
            partner2: data.partner2 || "",
            cultural_background: data.culturalBackground,
            how_we_met: data.howWeMet || "",
            theme: safeTheme,
            tagline: data.tagline || "",
            suggested_colors: safeColors as any,
            sections: data.sections as any,
            slug,
            display_font: safeDisplayFont,
            body_font: safeBodyFont,
          })
          .select()
          .single();
        if (error) throw error;
        // Remember the user's theme picks on their profile so future sites/editor sessions default to them.
        await supabase
          .from("profiles")
          .update({
            preferred_theme: safeTheme,
            preferred_colors: safeColors as any,
            preferred_display_font: safeDisplayFont,
            preferred_body_font: safeBodyFont,
          } as any)
          .eq("id", user.id);
        return site;
      } catch (err: any) {
        toast({ title: "Error saving site", description: err.message, variant: "destructive" });
        return null;
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  const updateSite = useCallback(
    async (
      siteId: string,
      data: {
        partner1?: string;
        partner2?: string;
        cultural_background?: string;
        how_we_met?: string;
        theme?: string;
        tagline?: string;
        suggested_colors?: string[];
        sections?: any[];
        is_published?: boolean;
        site_language?: string;
        translations?: any;
        display_font?: string;
        body_font?: string;
      }
    ) => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("wedding_sites")
          .update(data as any)
          .eq("id", siteId);
        if (error) throw error;
        // Mirror theme picks to the user's profile so re-opening the editor loads them automatically.
        if (data.theme !== undefined || data.suggested_colors !== undefined || data.display_font !== undefined || data.body_font !== undefined) {
          const { data: userRes } = await supabase.auth.getUser();
          const uid = userRes?.user?.id;
          if (uid) {
            const patch: any = {};
            if (data.theme !== undefined) patch.preferred_theme = data.theme || null;
            if (data.suggested_colors !== undefined) patch.preferred_colors = data.suggested_colors ?? null;
            if (data.display_font !== undefined) patch.preferred_display_font = data.display_font ?? null;
            if (data.body_font !== undefined) patch.preferred_body_font = data.body_font ?? null;
            await supabase.from("profiles").update(patch).eq("id", uid);
          }
        }
        return true;
      } catch (err: any) {
        toast({ title: "Error saving", description: err.message, variant: "destructive" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const loadUserSite = useCallback(async () => {
    if (!user) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wedding_sites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error("Load site error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadSiteBySlug = useCallback(async (slug: string) => {
    const { data, error } = await supabase
      .from("wedding_sites")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, []);

  const loadSiteById = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("wedding_sites")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, []);

  return { createSite, updateSite, loadUserSite, loadSiteBySlug, loadSiteById, saving, loading };
}
