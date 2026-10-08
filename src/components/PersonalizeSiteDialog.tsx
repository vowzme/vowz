import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImagePlus, Loader2, X, Sparkles } from "lucide-react";
import { useMediaUpload } from "@/hooks/use-media-upload";
import type { WeddingTheme } from "@/lib/wedding-themes";

export interface PersonalizeValues {
  partner1: string;
  partner2: string;
  date: string;
  tagline: string;
  story: string;
  heroUrl: string;
  galleryUrls: string[];
  colors?: { bg: string; accent: string; surface: string };
  displayFont?: string;
}

const FONTS = ["Playfair Display", "Cormorant Garamond", "Great Vibes", "Cinzel", "Lora", "Marcellus"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  theme: WeddingTheme | null;
  /** Custom mode shows color + font pickers for building a unique design. */
  custom?: boolean;
  busy?: boolean;
  onSubmit: (v: PersonalizeValues) => void;
}

export function PersonalizeSiteDialog({ open, onOpenChange, theme, custom, busy, onSubmit }: Props) {
  const { upload } = useMediaUpload();
  const [v, setV] = useState<PersonalizeValues>({
    partner1: "", partner2: "", date: "", tagline: "", story: "", heroUrl: "", galleryUrls: [],
    colors: { bg: "#FBF7EF", accent: "#B8893B", surface: "#FFFFFF" }, displayFont: "Playfair Display",
  });
  const [uploading, setUploading] = useState<"hero" | "gallery" | null>(null);
  const heroRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof PersonalizeValues>(k: K, val: PersonalizeValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const [uploadError, setUploadError] = useState<string | null>(null);

  const onHero = async (f?: File) => {
    if (!f) return;
    setUploadError(null);
    setUploading("hero");
    try {
      const url = await upload(f, "themes");
      if (url) set("heroUrl", url);
      else setUploadError("The photo couldn't upload. Please try again.");
    } catch {
      // The upload hook already shows a toast explaining known failures
      // (video, too large, storage limit); still reset the spinner below.
      setUploadError("The photo couldn't upload. Please try again.");
    } finally {
      setUploading(null);
      if (heroRef.current) heroRef.current.value = "";
    }
  };
  const onGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError(null);
    setUploading("gallery");
    const urls: string[] = [];
    try {
      for (const f of Array.from(files).slice(0, 6)) {
        const u = await upload(f, "themes");
        if (u) urls.push(u);
      }
      if (urls.length === 0) setUploadError("The photos couldn't upload. Please try again.");
    } catch {
      // Keep any photos that did succeed; the hook toasts known failures.
      setUploadError("Some photos couldn't upload. Please try again.");
    } finally {
      setUploading(null);
      if (galRef.current) galRef.current.value = "";
    }
    if (urls.length > 0) set("galleryUrls", [...v.galleryUrls, ...urls].slice(0, 12));
  };

  const valid = v.partner1.trim() && v.partner2.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 bg-background border-border">
        <DialogTitle className="font-display text-xl flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          {custom ? "Create your own design" : `Start with ${theme?.name ?? "this design"}`}
        </DialogTitle>
        <DialogDescription className="font-body text-sm text-muted-foreground">
          Add your names and photos. We'll build your real site and open the editor so you can change anything later.
        </DialogDescription>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="p1">Your name *</Label><Input id="p1" value={v.partner1} onChange={(e) => set("partner1", e.target.value)} placeholder="Priya" /></div>
            <div><Label htmlFor="p2">Partner's name *</Label><Input id="p2" value={v.partner2} onChange={(e) => set("partner2", e.target.value)} placeholder="Arjun" /></div>
          </div>
          <div><Label htmlFor="dt">Wedding date</Label><Input id="dt" type="date" value={v.date} onChange={(e) => set("date", e.target.value)} /></div>
          <div><Label htmlFor="tg">Tagline</Label><Input id="tg" value={v.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder={theme?.sampleTagline || "Two hearts, one journey"} /></div>
          <div><Label htmlFor="st">How you met (optional)</Label><Textarea id="st" rows={3} value={v.story} onChange={(e) => set("story", e.target.value)} placeholder="Tell your guests your story…" /></div>

          <div>
            <Label>Cover photo</Label>
            <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={(e) => onHero(e.target.files?.[0])} />
            {v.heroUrl ? (
              <div className="relative mt-1 rounded-lg overflow-hidden border border-border aspect-video">
                <img src={v.heroUrl} alt="Cover" className="w-full h-full object-cover" />
                <button type="button" aria-label="Remove cover" onClick={() => set("heroUrl", "")} className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => heroRef.current?.click()} className="mt-1 w-full aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-gold transition-colors">
                {uploading === "hero" ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
                <span className="text-sm font-body">Tap to upload a photo</span>
              </button>
            )}
          </div>

          <div>
            <Label>Gallery photos (up to 12)</Label>
            <input ref={galRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onGallery(e.target.files)} />
            <div className="mt-1 grid grid-cols-4 gap-2">
              {v.galleryUrls.map((u, i) => (
                <div key={u} className="relative aspect-square rounded-md overflow-hidden border border-border">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => set("galleryUrls", v.galleryUrls.filter((_, j) => j !== i))} className="absolute top-1 right-1 rounded-full bg-background/90 p-0.5"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {v.galleryUrls.length < 12 && (
                <button type="button" onClick={() => galRef.current?.click()} className="aspect-square rounded-md border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-gold">
                  {uploading === "gallery" ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          {uploadError && (
            <p className="text-sm font-body text-red-600 dark:text-red-400" role="alert">{uploadError}</p>
          )}

          {custom && v.colors && (
            <div className="space-y-3">
              <Label>Your colors</Label>
              <div className="grid grid-cols-3 gap-3">
                {(["bg", "accent", "surface"] as const).map((k) => (
                  <label key={k} className="flex flex-col items-center gap-1 text-xs font-body text-muted-foreground">
                    <input type="color" value={v.colors![k]} onChange={(e) => set("colors", { ...v.colors!, [k]: e.target.value })} className="w-12 h-12 rounded-full border border-border cursor-pointer" />
                    {k === "bg" ? "Background" : k === "accent" ? "Accent" : "Cards"}
                  </label>
                ))}
              </div>
              <Label htmlFor="font">Heading font</Label>
              <select id="font" value={v.displayFont} onChange={(e) => set("displayFont", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <div className="rounded-lg p-4 text-center border border-border" style={{ background: v.colors.bg }}>
                <div className="rounded-md p-3" style={{ background: v.colors.surface }}>
                  <p style={{ fontFamily: v.displayFont, color: v.colors.accent }} className="text-2xl">
                    {(v.partner1 || "Priya")} &amp; {(v.partner2 || "Arjun")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5 sticky bottom-0 bg-background pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1" disabled={!valid || busy || !!uploading} onClick={() => onSubmit(v)}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create my site"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
