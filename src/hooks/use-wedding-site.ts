import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

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
    }) => {
      if (!user) return null;
      setSaving(true);
      try {
        const slug = `${data.partner1.toLowerCase().replace(/\s+/g, "-")}-${data.partner2.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;
        const { data: site, error } = await supabase
          .from("wedding_sites")
          .insert({
            user_id: user.id,
            partner1: data.partner1,
            partner2: data.partner2,
            cultural_background: data.culturalBackground,
            how_we_met: data.howWeMet,
            theme: data.theme,
            tagline: data.tagline,
            suggested_colors: data.suggestedColors as any,
            sections: data.sections as any,
            slug,
          })
          .select()
          .single();
        if (error) throw error;
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
      }
    ) => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("wedding_sites")
          .update(data as any)
          .eq("id", siteId);
        if (error) throw error;
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

  return { createSite, updateSite, loadUserSite, loadSiteBySlug, saving, loading };
}
