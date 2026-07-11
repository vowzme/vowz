import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, ExternalLink, Sparkles, Share2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * Handler for the PWA `share_target` manifest entry. When a user shares a link
 * or text into the installed Vowz app from the OS share sheet, the OS opens
 * this route with `?title=&text=&url=` query params. We surface the payload
 * and offer next-step actions (start a new site prefilled with the shared
 * text, open the shared link, or copy it). No auth required — guests can
 * bounce straight into the onboarding wizard.
 */
export default function Share() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const title = params.get("title")?.trim() || "";
  const text = params.get("text")?.trim() || "";
  const url = params.get("url")?.trim() || "";

  // If `text` looks like a URL and `url` is empty (common on Android where
  // some apps stuff the link into `text`), promote it.
  const sharedLink = useMemo(() => {
    if (url) return url;
    if (text && /^https?:\/\/\S+$/i.test(text)) return text;
    return "";
  }, [text, url]);

  const hasPayload = Boolean(title || text || url);

  useEffect(() => {
    // Fire a lightweight analytics beacon so we can see share_target usage.
    try {
      const ev = new CustomEvent("vowz:share_target", {
        detail: { title, text, url, sharedLink },
      });
      window.dispatchEvent(ev);
    } catch {}
  }, [title, text, url, sharedLink]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" as any });
    }
  };

  const startSite = () => {
    // Stash payload for the wizard to prefill.
    try {
      sessionStorage.setItem(
        "vowz:sharedDraft",
        JSON.stringify({ title, text, url: sharedLink }),
      );
    } catch {}
    navigate("/wizard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Helmet>
        <title>Shared with Vowz</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <Card className="w-full max-w-lg p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Shared with Vowz
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              {hasPayload
                ? "Here's what you sent — start a wedding site or open the link."
                : "Nothing was shared. Try again from another app's share sheet."}
            </p>
          </div>
        </div>

        {hasPayload && (
          <div className="space-y-3">
            {title && (
              <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                <p className="font-body text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Title
                </p>
                <p className="font-body text-sm text-foreground break-words">{title}</p>
              </div>
            )}
            {text && text !== sharedLink && (
              <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                <p className="font-body text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Text
                </p>
                <p className="font-body text-sm text-foreground break-words whitespace-pre-wrap">
                  {text}
                </p>
              </div>
            )}
            {sharedLink && (
              <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                <p className="font-body text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Link
                </p>
                <a
                  href={sharedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-gold underline break-all"
                >
                  {sharedLink}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="gold" className="flex-1 min-h-11" onClick={startSite}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            Start a wedding site
          </Button>
          {sharedLink && (
            <>
              <Button
                variant="outline"
                className="flex-1 min-h-11"
                onClick={() => window.open(sharedLink, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Open link
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="min-h-11 min-w-11"
                onClick={() => copy(sharedLink)}
                aria-label="Copy link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </>
          )}
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Vowz
          </Link>
        </div>
      </Card>
    </div>
  );
}