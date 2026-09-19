const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Escape a value for injection into RegExp.
const rx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Extract <meta property/name="key" content="..."> for any of the given keys. */
function extractMeta(html: string, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  // Only search within <head> if we can find it — otherwise the whole doc.
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const scope = headMatch ? headMatch[1] : html;

  const tagRe = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(scope))) {
    const tag = m[0];
    const attr =
      /\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!attr) continue;
    const key = attr.toLowerCase();
    if (!keys.includes(key)) continue;
    const content =
      /\bcontent\s*=\s*["']([\s\S]*?)["']/i.exec(tag)?.[1] ?? "";
    if (out[key] === undefined) out[key] = decodeEntities(content);
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, "/");
}

function extractTitle(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? decodeEntities(m[1].trim()) : null;
}

function extractCanonical(html: string): string | null {
  const m =
    /<link[^>]+rel\s*=\s*["']canonical["'][^>]*>/i.exec(html) ||
    /<link[^>]+rel\s*=\s*canonical\b[^>]*>/i.exec(html);
  if (!m) return null;
  return /\bhref\s*=\s*["']([^"']+)["']/i.exec(m[0])?.[1] ?? null;
}

const OG_KEYS = [
  "og:title", "og:description", "og:image", "og:url", "og:type",
  "og:site_name", "og:locale", "og:image:alt", "og:image:width", "og:image:height",
];
const TW_KEYS = [
  "twitter:card", "twitter:title", "twitter:description", "twitter:image",
  "twitter:site", "twitter:creator", "twitter:image:alt",
];
const BASIC_KEYS = ["description", "keywords", "robots", "author", "viewport"];

// Only the platform's own public pages may be fetched by this preview tool.
const ALLOWED_HOSTS = new Set(["vowz.me", "www.vowz.me"]);
function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_HOSTS.has(h) || h.endsWith(".lovable.app") || h.endsWith(".vowz.me");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let target: string | null = null;
    if (req.method === "GET") {
      target = new URL(req.url).searchParams.get("url");
    } else {
      const body = await req.json().catch(() => ({}));
      target = body?.url ?? null;
    }

    if (!target) {
      return json({ error: "Missing 'url' parameter" }, 400);
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return json({ error: "Invalid URL" }, 400);
    }
    if (parsed.protocol !== "https:") {
      return json({ error: "Only https URLs are supported" }, 400);
    }
    if (!isAllowedHost(parsed.hostname)) {
      return json({ error: "Only Vowz wedding pages can be previewed here." }, 400);
    }

    // Follow redirects manually so every hop stays on an allowed Vowz host —
    // this endpoint can never be used to probe other servers or internal hosts.
    let current = parsed;
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      res = await fetch(current.toString(), {
        redirect: "manual",
        headers: {
          "User-Agent":
            "facebookexternalhit/1.1 (+https://www.facebook.com/externalhit_uatext.php) Vowz-SharePreview/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        let next: URL;
        try {
          next = new URL(location, current);
        } catch {
          return json({ error: "Upstream sent an invalid redirect" }, 400);
        }
        if (next.protocol !== "https:" || !isAllowedHost(next.hostname)) {
          return json({ error: "Redirect left the allowed Vowz pages" }, 400);
        }
        current = next;
        continue;
      }
      break;
    }
    if (!res) return json({ error: "Could not load that page" }, 400);

    const finalUrl = current.toString();
    const status = res.status;
    const contentType = res.headers.get("content-type") ?? "";

    if (!res.ok) {
      return json({
        error: `Upstream returned ${status}`,
        finalUrl, status, contentType,
      }, 200);
    }

    const html = (await res.text()).slice(0, 500_000);
    const allKeys = [...OG_KEYS, ...TW_KEYS, ...BASIC_KEYS];
    const meta = extractMeta(html, allKeys);
    const og: Record<string, string> = {};
    const tw: Record<string, string> = {};
    const basic: Record<string, string> = {};
    for (const [k, v] of Object.entries(meta)) {
      if (k.startsWith("og:")) og[k] = v;
      else if (k.startsWith("twitter:")) tw[k] = v;
      else basic[k] = v;
    }

    return json({
      requestedUrl: target,
      finalUrl,
      status,
      contentType,
      title: extractTitle(html),
      canonical: extractCanonical(html),
      og,
      twitter: tw,
      basic,
      htmlBytes: html.length,
    }, 200);
  } catch (e) {
    return json({ error: (e as Error).message || "Failed to fetch URL" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}