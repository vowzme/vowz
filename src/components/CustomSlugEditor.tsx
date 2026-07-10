import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Link2, Check, X, Loader2, RefreshCw, Copy, Crown, ExternalLink,
} from "lucide-react";
import { BarChart3 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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

  // Default Instagram caption from couple names + wedding date.
  const defaultCaption = (() => {
    const p1 = partner1?.trim() || "We";
    const p2 = partner2?.trim() || "";
    let dateStr = "";
    if (weddingDate) {
      try {
        dateStr = new Date(weddingDate).toLocaleDateString(undefined, {
          month: "long", day: "numeric", year: "numeric",
        });
      } catch { /* ignore */ }
    }
    const couple = p2 ? `${p1} & ${p2}` : p1;
    return `${couple} are getting married${dateStr ? ` on ${dateStr}` : ""}! 💍✨\n\nVisit our wedding site for all the details 👇\n\n#Wedding #SaveTheDate`;
  })();
  const [caption, setCaption] = useState(defaultCaption);
  const [captionEdited, setCaptionEdited] = useState(false);

  // Keep caption in sync with partner/date changes until the user edits it.
  useEffect(() => {
    if (!captionEdited) setCaption(defaultCaption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner1, partner2, weddingDate]);

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

  const buildTrackedUrl = (raw: string) => {
    try {
      const u = new URL(raw);
      u.searchParams.set("utm_source", "copy_url");
      u.searchParams.set("utm_medium", "share");
      u.searchParams.set("utm_campaign", "live_preview");
      return u.toString();
    } catch { return raw; }
  };

  const copyTrackedUrl = async (raw: string, toastTitle = "URL copied! 📋") => {
    const tracked = buildTrackedUrl(raw);
    try { await navigator.clipboard.writeText(tracked); } catch {}
    trackEvent("share_click", {
      channel: "copy_url",
      url: tracked,
      utm_source: "copy_url",
      utm_medium: "share",
      utm_campaign: "live_preview",
    });
    toast({ title: toastTitle, description: tracked });
  };

  const copyUrl = () => copyTrackedUrl(`${baseUrl}${slug || currentSlug}`);

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
          onClick={() => copyTrackedUrl(previewUrl, "Preview URL copied! 📋")}
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
          onClick={() => copyTrackedUrl(previewUrl, "Preview URL copied! 📋")}
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
        caption={caption}
      />
      <ShareAnalytics siteId={siteId} />
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground font-body">Instagram caption</label>
          <button
            type="button"
            onClick={() => { setCaption(defaultCaption); setCaptionEdited(false); }}
            className="text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted"
          >
            Reset
          </button>
        </div>
        <Textarea
          value={caption}
          onChange={(e) => { setCaption(e.target.value); setCaptionEdited(true); }}
          rows={4}
          maxLength={2200}
          placeholder="Write a caption for Instagram…"
          className="text-sm font-body"
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">{caption.length}/2200</p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${caption}\n${previewUrl}`);
              toast({ title: "Caption copied 📋", description: "Paste it into Instagram." });
            }}
            className="text-[11px] text-[hsl(var(--gold))] hover:underline"
          >
            Copy caption + link
          </button>
        </div>
      </div>
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

// ─── Social share row ────────────────────────────────────────────────
type ShareChannel = {
  key: string;
  label: string;
  color: string;
  icon: JSX.Element;
  build: (url: string) => string | null; // null → use native/copy fallback
};

const CHANNELS: ShareChannel[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.52 3.48A11.94 11.94 0 0012.06 0C5.51 0 .18 5.33.18 11.88c0 2.09.55 4.13 1.6 5.93L0 24l6.34-1.66a11.86 11.86 0 005.72 1.46h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.16-3.43-8.44zM12.07 21.7h-.01a9.83 9.83 0 01-5.01-1.37l-.36-.21-3.76.99 1-3.66-.24-.38a9.83 9.83 0 01-1.5-5.19c0-5.44 4.43-9.87 9.88-9.87 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.98c0 5.44-4.43 9.87-9.88 9.87zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.48c0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg>
    ),
    build: (u) => `https://wa.me/?text=${encodeURIComponent(u)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12z"/></svg>
    ),
    build: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  },
  {
    key: "twitter",
    label: "X",
    color: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2H21l-6.52 7.45L22 22h-6.813l-4.77-6.24L4.8 22H2l7.02-8.02L2 2h6.914l4.31 5.7L18.244 2zm-1.194 18h1.83L7.05 4H5.1l11.95 16z"/></svg>
    ),
    build: (u) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent("Our wedding site")}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    color: "#26A5E4",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9.78 15.72 9.6 19.4c.34 0 .49-.15.67-.32l1.6-1.53 3.32 2.43c.61.34 1.05.16 1.22-.56l2.21-10.36c.2-.9-.32-1.25-.92-1.03L4.35 12.53c-.88.34-.87.83-.15 1.05l3.8 1.19 8.82-5.56c.42-.27.8-.12.49.15z"/></svg>
    ),
    build: (u) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent("Our wedding site")}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.42v1.56h.05c.48-.9 1.65-1.85 3.39-1.85 3.63 0 4.3 2.39 4.3 5.5v6.24zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
    ),
    build: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
  },
  {
    key: "email",
    label: "Email",
    color: "#6B7280",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
    ),
    build: (u) => `mailto:?subject=${encodeURIComponent("Our wedding site")}&body=${encodeURIComponent(u)}`,
  },
  {
    key: "instagram",
    label: "Instagram",
    color: "#DD2A7B",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.37.06 2.63.33 3.6 1.3.98.98 1.25 2.24 1.31 3.61.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.06 1.37-.33 2.63-1.3 3.6-.98.98-2.24 1.25-3.61 1.31-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.37-.06-2.63-.33-3.6-1.3-.98-.98-1.25-2.24-1.31-3.61C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.06-1.37.33-2.63 1.3-3.6.98-.98 2.24-1.25 3.61-1.31C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.5.42 3.4 1.52 2.3 2.62 2 3.9 1.94 5.17 1.88 6.45 1.87 6.86 1.87 12s.01 5.55.07 6.83c.06 1.27.36 2.55 1.46 3.65 1.1 1.1 2.38 1.4 3.65 1.46 1.28.06 1.69.07 6.95.07s5.67-.01 6.95-.07c1.27-.06 2.55-.36 3.65-1.46 1.1-1.1 1.4-2.38 1.46-3.65.06-1.28.07-1.69.07-6.95s-.01-5.67-.07-6.95c-.06-1.27-.36-2.55-1.46-3.65C21.5.42 20.22.13 18.95.07 17.67.01 17.26 0 12 0zm0 5.84A6.16 6.16 0 105.84 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zm6.4-11.85a1.44 1.44 0 11-1.44 1.44 1.44 1.44 0 011.44-1.44z"/></svg>
    ),
    build: () => null, // no web share endpoint — native/copy fallback
  },
];

function ShareRow({
  url,
  slug,
  trackEvent,
  caption,
}: {
  url: string;
  slug: string;
  trackEvent: (event: string, metadata?: Record<string, any>) => void;
  caption?: string;
}) {
  const handleShare = async (c: ShareChannel) => {
    const u = new URL(url);
    u.searchParams.set("utm_source", c.key);
    u.searchParams.set("utm_medium", "share");
    u.searchParams.set("utm_campaign", "live_preview");
    const trackedUrl = u.toString();
    trackEvent("share_click", { channel: c.key, url: trackedUrl, slug });

    const target = c.build(trackedUrl);
    if (target) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }
    // Instagram / no-endpoint fallback
    const shareText = caption ? `${caption}\n${trackedUrl}` : trackedUrl;
    try { await navigator.clipboard.writeText(shareText); } catch {}
    if (navigator.share) {
      try { await navigator.share({ title: "Our wedding site", text: caption, url: trackedUrl }); return; } catch {}
    }
    toast({ title: c.key === "instagram" ? "Caption + link copied 📋" : "Link copied 📋", description: `Paste it into ${c.label}.` });
    if (c.key === "instagram") window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const nativeShare = async () => {
    trackEvent("share_click", { channel: "native", url, slug });
    if (navigator.share) {
      try { await navigator.share({ title: "Our wedding site", url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); } catch {}
    toast({ title: "Link copied 📋" });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground font-body">Share</p>
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => handleShare(c)}
            aria-label={`Share on ${c.label}`}
            title={`Share on ${c.label}`}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-border/50 bg-background/50 hover:opacity-80 transition"
            style={{ color: c.color }}
          >
            {c.icon}
          </button>
        ))}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={nativeShare}
            aria-label="More share options"
            title="More"
            className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-border/50 bg-background/50 hover:opacity-80 transition text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 8a3 3 0 10-2.83-4H15L8.83 8.17A3 3 0 106 12a3 3 0 002.83-1.83L15 6l.17.17A3 3 0 0018 8zM6 20a3 3 0 100-6 3 3 0 000 6zm12 0a3 3 0 100-6 3 3 0 000 6zm-3-3.17L8.83 12.83A2.99 2.99 0 019 12l6.17 4.17c-.11.26-.17.54-.17.83z"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Share analytics panel ───────────────────────────────────────────
const CHANNEL_META: Record<string, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  facebook: { label: "Facebook", color: "#1877F2" },
  twitter:  { label: "X",        color: "#000000" },
  telegram: { label: "Telegram", color: "#26A5E4" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  email:    { label: "Email",    color: "#6B7280" },
  instagram:{ label: "Instagram",color: "#DD2A7B" },
  native:   { label: "Native",   color: "#6B7280" },
  copy_url: { label: "Copy URL", color: "#D4AF37" },
};

function ShareAnalytics({ siteId }: { siteId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_analytics" as any)
      .select("metadata")
      .eq("wedding_site_id", siteId)
      .eq("event_type", "share_click")
      .limit(2000);
    const c: Record<string, number> = {};
    (data as any[] | null)?.forEach((row) => {
      const key = row?.metadata?.channel || row?.metadata?.platform || "other";
      c[key] = (c[key] || 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2 pt-2 border-t border-border/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
          <p className="text-xs font-medium text-foreground font-body">
            Share analytics {total > 0 && <span className="text-muted-foreground">({total})</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading…
        </p>
      ) : entries.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No share clicks yet. Share your link to start tracking.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([key, n]) => {
            const meta = CHANNEL_META[key] || { label: key, color: "#6B7280" };
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-[11px] rounded-full border border-border/50 bg-background/50 px-2 py-0.5"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                <span className="text-foreground font-body">{meta.label}</span>
                <span className="text-muted-foreground font-mono">{n}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
