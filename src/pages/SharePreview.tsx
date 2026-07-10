import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Search, AlertCircle, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type PreviewResult = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  contentType: string;
  title: string | null;
  canonical: string | null;
  og: Record<string, string>;
  twitter: Record<string, string>;
  basic: Record<string, string>;
  htmlBytes: number;
  error?: string;
};

export default function SharePreview() {
  const [url, setUrl] = useState(
    typeof window !== "undefined" ? window.location.origin : ""
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("share-preview", {
        body: { url: url.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error && !(data as any)?.og) {
        setError((data as any).error);
      } else {
        setResult(data as PreviewResult);
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch preview");
    } finally {
      setLoading(false);
    }
  };

  const og = result?.og || {};
  const tw = result?.twitter || {};
  const previewTitle = og["og:title"] || tw["twitter:title"] || result?.title || "";
  const previewDesc = og["og:description"] || tw["twitter:description"] || result?.basic?.description || "";
  const previewImage = og["og:image"] || tw["twitter:image"] || "";
  const previewUrl = og["og:url"] || result?.canonical || result?.finalUrl || "";
  const twCard = tw["twitter:card"] || "summary_large_image";

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied 📋" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Share Preview Tester — Vowz</title>
        <meta name="description" content="Fetch and inspect the exact Open Graph and Twitter Card meta tags served for any URL." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Share preview tester
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Fetches your URL server-side (as a social crawler) and shows the exact Open Graph and Twitter Card tags returned.
          </p>
        </header>

        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 space-y-3">
          <label className="text-xs font-medium text-foreground font-body">URL to test</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://vowz.me/site/your-slug"
              onKeyDown={(e) => e.key === "Enter" && run()}
              className="font-mono text-sm"
            />
            <Button onClick={run} disabled={loading || !url.trim()} className="shrink-0 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Fetch tags
            </Button>
          </div>
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>

        {result && (
          <>
            {/* Response info */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 space-y-2">
              <h2 className="font-display text-base font-semibold text-foreground">Response</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs font-body">
                <Row k="Status" v={
                  <Badge variant={result.status >= 200 && result.status < 300 ? "default" : "destructive"}>
                    {result.status}
                  </Badge>
                } />
                <Row k="Content-Type" v={<span className="font-mono">{result.contentType || "—"}</span>} />
                <Row k="Final URL" v={
                  <a href={result.finalUrl} target="_blank" rel="noopener" className="font-mono text-[hsl(var(--gold))] hover:underline break-all">
                    {result.finalUrl}
                  </a>
                } />
                <Row k="HTML size" v={<span className="font-mono">{(result.htmlBytes / 1024).toFixed(1)} KB</span>} />
                <Row k="Canonical" v={<span className="font-mono break-all">{result.canonical || "—"}</span>} />
                <Row k="<title>" v={<span className="break-all">{result.title || "—"}</span>} />
              </dl>
            </div>

            {/* Social preview cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PreviewCard
                label="Facebook / LinkedIn / WhatsApp"
                title={previewTitle}
                desc={previewDesc}
                image={previewImage}
                url={previewUrl}
                variant="og"
              />
              <PreviewCard
                label={`X / Twitter (${twCard})`}
                title={previewTitle}
                desc={previewDesc}
                image={previewImage}
                url={previewUrl}
                variant={twCard === "summary" ? "twitter-small" : "twitter-large"}
              />
            </div>

            <TagTable heading="Open Graph tags" data={og} onCopy={copy} highlightMissing={["og:title", "og:description", "og:image", "og:url", "og:type"]} />
            <TagTable heading="Twitter Card tags" data={tw} onCopy={copy} highlightMissing={["twitter:card", "twitter:title", "twitter:description", "twitter:image"]} />
            <TagTable heading="Basic meta" data={result.basic} onCopy={copy} highlightMissing={["description"]} />
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-foreground">{v}</dd>
    </>
  );
}

function PreviewCard({
  label, title, desc, image, url, variant,
}: {
  label: string;
  title: string;
  desc: string;
  image: string;
  url: string;
  variant: "og" | "twitter-large" | "twitter-small";
}) {
  const small = variant === "twitter-small";
  const host = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground font-body">{label}</p>
      <div className="rounded-xl border border-border/50 bg-muted/10 overflow-hidden">
        {small ? (
          <div className="flex">
            {image ? (
              <img src={image} alt="" className="w-24 h-24 object-cover shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-24 h-24 bg-muted shrink-0 flex items-center justify-center text-[10px] text-muted-foreground">No image</div>
            )}
            <div className="p-3 min-w-0">
              <p className="text-[10px] text-muted-foreground truncate">{host}</p>
              <p className="text-sm font-semibold text-foreground line-clamp-2">{title || "Untitled"}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
            </div>
          </div>
        ) : (
          <>
            {image ? (
              <img src={image} alt="" className="w-full aspect-[1.91/1] object-cover bg-muted" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-full aspect-[1.91/1] bg-muted flex items-center justify-center text-xs text-muted-foreground">No og:image</div>
            )}
            <div className="p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{host}</p>
              <p className="text-sm font-semibold text-foreground line-clamp-2">{title || "Untitled"}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TagTable({
  heading, data, onCopy, highlightMissing = [],
}: {
  heading: string;
  data: Record<string, string>;
  onCopy: (s: string) => void;
  highlightMissing?: string[];
}) {
  const keys = Array.from(new Set([...highlightMissing, ...Object.keys(data)]));
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 space-y-3">
      <h2 className="font-display text-base font-semibold text-foreground">{heading}</h2>
      {keys.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tags found.</p>
      ) : (
        <div className="divide-y divide-border/40">
          {keys.map((k) => {
            const v = data[k];
            const missing = !v;
            return (
              <div key={k} className="py-2 grid grid-cols-[minmax(0,10rem)_1fr_auto] gap-3 items-start text-xs">
                <code className="font-mono text-[hsl(var(--gold))] break-all">{k}</code>
                <div className={`break-all font-body ${missing ? "text-muted-foreground italic" : "text-foreground"}`}>
                  {missing ? "— missing —" : v}
                </div>
                {v ? (
                  <button
                    type="button"
                    onClick={() => onCopy(v)}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted"
                  >
                    Copy
                  </button>
                ) : (
                  <AlertCircle className="w-3 h-3 text-destructive" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}