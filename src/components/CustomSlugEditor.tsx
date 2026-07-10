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
import { useAnalyticsTracker } from "@/hooks/use-analytics";

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
  const { trackEvent } = useAnalyticsTracker(siteId);

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
      <ShareRow
        url={previewUrl}
        slug={previewSlug}
        trackEvent={trackEvent}
      />
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
