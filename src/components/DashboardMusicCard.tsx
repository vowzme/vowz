import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Music, Edit3, VolumeX, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import HelpTip from "@/components/HelpTip";

interface DashboardMusicCardProps {
  site: any;
  onUpdate: (site: any) => void;
}

/**
 * Compact settings card showing the wedding site's current background
 * music selection with a quick enable/disable toggle. Detailed picker
 * (categories + track list) lives in the Editor's Background Music
 * section; the "Change music" button deep-links there.
 */
const DashboardMusicCard = ({ site, onUpdate }: DashboardMusicCardProps) => {
  const musicSection = useMemo(
    () => (site?.sections || []).find((s: any) => s?.type === "music"),
    [site?.sections],
  );
  const music = musicSection?.data || {};
  const enabled: boolean = music.enabled !== false;
  const trackName: string = music.trackName || "First Dance";
  const category: string = music.category || "romantic";

  const toggle = async (next: boolean) => {
    if (!site?.id) return;
    const sections = (site.sections || []).map((s: any) =>
      s?.type === "music"
        ? { ...s, data: { ...(s.data || {}), enabled: next } }
        : s,
    );
    // If no music section exists yet, add one with sensible defaults.
    if (!sections.some((s: any) => s?.type === "music")) {
      sections.push({
        type: "music",
        title: "Background Music",
        data: {
          enabled: next,
          category: "romantic",
          trackUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          trackName: "First Dance",
          autoplay: true,
          loop: true,
          volume: 0.4,
        },
      });
    }
    const { error } = await supabase
      .from("wedding_sites")
      .update({ sections } as any)
      .eq("id", site.id);
    if (error) {
      toast({ title: "Couldn't update music", description: error.message, variant: "destructive" as any });
      return;
    }
    onUpdate({ ...site, sections });
    toast({ title: next ? "Background music enabled 🎵" : "Background music muted" });
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6" data-tour="music">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-gold" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-1.5">
            Background Music
            <HelpTip topic="music" />
          </h2>
          <p className="font-body text-xs text-muted-foreground">
            Choose what guests hear when they open your site.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {enabled ? (
            <Volume2 className="w-4 h-4 text-gold shrink-0" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-body text-sm font-medium text-foreground truncate">
              {trackName}
            </p>
            <p className="font-body text-[11px] text-muted-foreground capitalize">
              {category} • {enabled ? "Playing on your site" : "Muted"}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={toggle}
          aria-label={enabled ? "Mute background music" : "Enable background music"}
          className="shrink-0"
        />
      </div>

      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto min-h-11">
        <Link to={`/editor${site?.id ? `/${site.id}` : ""}#music`}>
          <Edit3 className="w-4 h-4 mr-1.5" /> Change music
        </Link>
      </Button>
    </div>
  );
};

export default DashboardMusicCard;