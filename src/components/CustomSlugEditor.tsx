import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Link2, Check, X, Loader2, RefreshCw, Copy, Crown, ExternalLink,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import PremiumUpgradeButton from "@/components/PremiumUpgradeButton";
import { usePricingRegion, formatPrice } from "@/hooks/use-pricing-region";
import QRCodeGenerator from "@/components/QRCodeGenerator";

interface CustomSlugEditorProps {
  siteId: string;
  currentSlug: string;
  partner1: string;
  partner2: string;
  weddingDate?: string | null;
  isPremium: boolean;
  onSlugSaved: (newSlug: string) => void;
}

const RESERVED_SLUGS = [
  "admin", "dashboard", "pricing", "login", "auth", "signup",
  "site", "editor", "wizard", "api", "blog", "contact",
  "about", "terms", "privacy", "settings", "affiliate",
];

const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const MIN_LEN = 5;
const MAX_LEN = 50;

type AvailabilityState = "idle" | "checking" | "available" | "taken" | "error";

function sanitizeSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LEN);
}

function generateSuggestion(p1: string, p2: string, date?: string | null): string {
  const a = sanitizeSlug(p1.trim());
  const b = sanitizeSlug(p2.trim());
  let year = "";
  if (date) {
    try {
      year = new Date(date).getFullYear().toString();
    } catch { /* ignore */ }
  }
  const options = [
    `${a}-and-${b}${year ? `-${year}` : ""}`,
    `${a}-${b}-wedding${year ? `-${year}` : ""}`,
    `${b}-${a}${year ? `-${year}` : ""}`,
  ];
  return options[Math.floor(Math.random() * options.length)].slice(0, MAX_LEN);
}

function validateSlug(slug: string): string | null {
  if (!slug) return "Slug is required.";
  if (slug.length < MIN_LEN) return `Must be at least ${MIN_LEN} characters.`;
  if (slug.length > MAX_LEN) return `Must be at most ${MAX_LEN} characters.`;
  if (slug.startsWith("-") || slug.endsWith("-")) return "Cannot start or end with a hyphen.";
  if (/--/.test(slug)) return "Cannot contain consecutive hyphens.";
  if (!SLUG_REGEX.test(slug)) return "Only lowercase letters, numbers, and hyphens allowed.";
  if (RESERVED_SLUGS.includes(slug)) return `"${slug}" is reserved. Try another.`;
  return null;
}

export default function CustomSlugEditor({
  siteId, currentSlug, partner1, partner2, weddingDate, isPremium, onSlugSaved,
}: CustomSlugEditorProps) {
  const { pricing } = usePricingRegion();
  const [slug, setSlug] = useState(currentSlug || "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>("idle");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const baseUrl = `${window.location.origin}/site/`;

  const checkAvailability = useCallback(async (s: string) => {
    const err = validateSlug(s);
    setValidationError(err);
    if (err) { setAvailability("idle"); return; }
    if (s === currentSlug) { setAvailability("available"); return; }

    setAvailability("checking");
    try {
      const { data, error } = await supabase.rpc("check_slug_available", {
        _slug: s,
        _exclude_site_id: siteId,
      } as any);
      if (error) { setAvailability("error"); return; }
      setAvailability(data ? "available" : "taken");
    } catch {
      setAvailability("error");
    }
  }, [currentSlug, siteId]);

  const handleChange = (val: string) => {
    const sanitized = sanitizeSlug(val);
    setSlug(sanitized);
    setAvailability("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (sanitized) checkAvailability(sanitized);
    }, 400);
  };

  const handleSuggest = () => {
    const suggestion = generateSuggestion(partner1, partner2, weddingDate);
    setSlug(suggestion);
    checkAvailability(suggestion);
  };

  const handleSave = async () => {
    if (availability !== "available" || validationError) return;
    setSaving(true);

    // Save old slug as redirect before updating
    if (currentSlug && currentSlug !== slug) {
      await supabase
        .from("slug_redirects")
        .upsert({ old_slug: currentSlug, wedding_site_id: siteId } as any, { onConflict: "old_slug" });
    }

    const { error } = await supabase
      .from("wedding_sites")
      .update({ slug } as any)
      .eq("id", siteId);
    if (error) {
      if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
        setAvailability("taken");
        toast({ title: "Slug already taken", description: "Someone just claimed it. Try another.", variant: "destructive" });
      } else {
        toast({ title: "Error saving", description: error.message, variant: "destructive" });
      }
    } else {
      // Remove any redirect pointing to the new slug (in case it was previously someone's old slug)
      await supabase.from("slug_redirects").delete().eq("old_slug", slug);
      toast({ title: "Custom URL saved! 🎉", description: `Your site is now at ${baseUrl}${slug}` });
      onSlugSaved(slug);
    }
    setSaving(false);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`${baseUrl}${slug || currentSlug}`);
    toast({ title: "URL copied! 📋" });
  };

  // Cleanup debounce
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const hasChanged = slug !== currentSlug;
  const canSave = hasChanged && availability === "available" && !validationError;

  // Live preview URL: use the in-progress slug if it passes basic validation,
  // otherwise fall back to the saved slug so the preview is always visible.
  const previewSlug =
    slug && !validateSlug(slug) ? slug : currentSlug;
  const previewUrl = `${baseUrl}${previewSlug}`;
  const coupleNames = `${partner1}-${partner2}`;

  const LivePreview = (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground font-body">Live preview</p>
        {hasChanged && previewSlug === slug && (
          <Badge variant="outline" className="text-[10px] h-5">Unsaved</Badge>
        )}
      </div>
      <div className="flex items-center gap-2 bg-background/50 rounded-md px-3 py-2">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener"
          className="flex-1 text-sm font-mono text-[hsl(var(--gold))] break-all hover:underline"
        >
          {previewUrl}
        </a>
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 h-8 w-8"
          onClick={() => {
            navigator.clipboard.writeText(previewUrl);
            toast({ title: "Preview URL copied! 📋" });
          }}
          aria-label="Copy preview URL"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="gold"
          className="w-full gap-2"
          onClick={() => {
            navigator.clipboard.writeText(previewUrl);
            toast({ title: "Preview URL copied! 📋", description: previewUrl });
          }}
          aria-label="Copy preview URL to clipboard"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy URL
        </Button>
        <Button size="sm" variant="outline" className="w-full gap-2" asChild>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" />
            Open live site
          </a>
        </Button>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10 border-[#25D366]/30"
        onClick={() => {
          const shareText = encodeURIComponent(previewUrl);
          window.open(`https://wa.me/?text=${shareText}`, "_blank", "noopener,noreferrer");
        }}
        aria-label="Share on WhatsApp"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.759-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.2.05-.374-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Share on WhatsApp
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 text-white border-transparent bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(previewUrl);
          } catch {}
          if (navigator.share) {
            try {
              await navigator.share({ title: "Our wedding site", url: previewUrl });
              return;
            } catch {}
          }
          toast({
            title: "Link copied 📋",
            description: "Paste it into your Instagram story, bio, or DM.",
          });
          window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
        }}
        aria-label="Share on Instagram"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608C4.516 2.567 5.783 2.295 7.15 2.233 8.416 2.175 8.796 2.163 12 2.163zm0 1.837c-3.148 0-3.515.012-4.756.069-1.017.046-1.57.215-1.937.357-.487.19-.835.417-1.2.782-.365.365-.592.713-.782 1.2-.142.367-.311.92-.357 1.937C3.011 8.485 3 8.852 3 12s.012 3.515.069 4.756c.046 1.017.215 1.57.357 1.937.19.487.417.835.782 1.2.365.365.713.592 1.2.782.367.142.92.311 1.937.357C8.485 20.989 8.852 21 12 21s3.515-.012 4.756-.069c1.017-.046 1.57-.215 1.937-.357.487-.19.835-.417 1.2-.782.365-.365.592-.713.782-1.2.142-.367.311-.92.357-1.937.058-1.241.069-1.608.069-4.756s-.012-3.515-.069-4.756c-.046-1.017-.215-1.57-.357-1.937a3.098 3.098 0 00-.782-1.2 3.098 3.098 0 00-1.2-.782c-.367-.142-.92-.311-1.937-.357C15.515 4.012 15.148 4 12 4zm0 3.838a4.162 4.162 0 110 8.324 4.162 4.162 0 010-8.324zm0 6.87a2.708 2.708 0 100-5.416 2.708 2.708 0 000 5.416zm5.29-7.05a.97.97 0 11-1.94 0 .97.97 0 011.94 0z"/>
        </svg>
        Share on Instagram
      </Button>
      <QRCodeGenerator url={previewUrl} coupleNames={coupleNames} isPremium={isPremium} />
    </div>
  );

  // Disabled state for free users
  if (!isPremium) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-[hsl(var(--gold))]" />
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground">Website URL & Sharing</h3>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-body">Current URL</p>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5">
            <span className="text-sm font-mono text-muted-foreground truncate flex-1">{baseUrl}{currentSlug}</span>
            <Button size="icon" variant="ghost" className="shrink-0" onClick={copyUrl}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {LivePreview}

        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-center space-y-3 opacity-80">
          <Crown className="w-8 h-8 text-[hsl(var(--gold))] mx-auto" />
          <p className="font-display text-sm font-semibold text-foreground">Custom URLs available in Premium</p>
          <p className="text-xs text-muted-foreground font-body">
            Get a memorable URL like <span className="font-mono text-foreground">vowz.me/priya-anooj-wedding</span>
          </p>
          <PremiumUpgradeButton
            size="sm"
            label={`Upgrade for ${formatPrice(pricing, "premium")}/yr`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="w-5 h-5 text-[hsl(var(--gold))]" />
        <h3 className="font-display text-base sm:text-lg font-bold text-foreground">Website URL & Sharing</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground cursor-help underline decoration-dotted">ℹ</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[250px] text-xs">
            A short, memorable URL makes sharing easier (e.g. vowz.me/priya-anooj-wedding)
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Current URL */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-body">Current URL</p>
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-sm font-mono text-muted-foreground truncate flex-1">{baseUrl}{currentSlug}</span>
          <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" onClick={copyUrl}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" asChild>
            <a href={`/site/${currentSlug}`} target="_blank" rel="noopener">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Slug editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground font-body">Custom URL slug</label>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleSuggest}>
            <RefreshCw className="w-3 h-3" /> Suggest
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <div className="flex items-center rounded-md border border-input bg-background">
              <span className="text-xs text-muted-foreground font-mono px-3 py-2.5 border-r border-input bg-muted/50 whitespace-nowrap rounded-l-md">/site/</span>
              <input
                className="flex-1 bg-transparent px-3 py-2 text-sm font-mono outline-none placeholder:text-muted-foreground min-w-0"
                value={slug}
                onChange={e => handleChange(e.target.value)}
                placeholder="your-custom-slug"
                maxLength={MAX_LEN}
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>

        {/* Feedback */}
        {validationError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <X className="w-3 h-3" /> {validationError}
          </p>
        )}
        {!validationError && availability === "checking" && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking availability…
          </p>
        )}
        {!validationError && availability === "available" && (
          <p className="text-xs text-[hsl(var(--gold))] flex items-center gap-1">
            <Check className="w-3 h-3" /> Available! Your site will be at <span className="font-mono">{baseUrl}{slug}</span>
          </p>
        )}
        {!validationError && availability === "taken" && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <X className="w-3 h-3" /> Already taken. Try another.
          </p>
        )}

        <p className="text-[11px] text-muted-foreground">
          {slug.length}/{MAX_LEN} characters · lowercase letters, numbers, and hyphens only
        </p>
      </div>

      {LivePreview}
    </div>
  );
}
