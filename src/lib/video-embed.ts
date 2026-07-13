// Shared video URL → embed parser. Supports the providers couples actually use.
// Returns { src, provider, label } or null if URL is unsupported.

export type VideoProvider =
  | "youtube"
  | "vimeo"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "dailymotion"
  | "googledrive"
  | "twitch";

export interface VideoEmbed {
  src: string;
  provider: VideoProvider;
  label: string;
}

export const SUPPORTED_VIDEO_PROVIDERS: { id: VideoProvider; label: string; example: string; uploadUrl: string }[] = [
  { id: "youtube",     label: "YouTube",      example: "https://youtu.be/abc123",                      uploadUrl: "https://studio.youtube.com" },
  { id: "vimeo",       label: "Vimeo",        example: "https://vimeo.com/123456789",                  uploadUrl: "https://vimeo.com/upload" },
  { id: "facebook",    label: "Facebook",     example: "https://www.facebook.com/.../videos/123",      uploadUrl: "https://www.facebook.com" },
  { id: "instagram",   label: "Instagram",    example: "https://www.instagram.com/reel/abc/",          uploadUrl: "https://www.instagram.com" },
  { id: "tiktok",      label: "TikTok",       example: "https://www.tiktok.com/@user/video/123",       uploadUrl: "https://www.tiktok.com/upload" },
  { id: "dailymotion", label: "Dailymotion",  example: "https://www.dailymotion.com/video/x7abcde",    uploadUrl: "https://www.dailymotion.com/upload" },
  { id: "googledrive", label: "Google Drive", example: "https://drive.google.com/file/d/FILE_ID/view", uploadUrl: "https://drive.google.com" },
  { id: "twitch",      label: "Twitch",       example: "https://www.twitch.tv/videos/123456789",       uploadUrl: "https://www.twitch.tv" },
];

function host(): string {
  if (typeof window === "undefined") return "vowz.me";
  return window.location.hostname || "vowz.me";
}

export function parseVideoUrl(raw: string): VideoEmbed | null {
  if (!raw) return null;
  const url = raw.trim();

  // YouTube (watch, youtu.be, shorts, live, embed)
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { src: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`, provider: "youtube", label: "YouTube" };

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { src: `https://player.vimeo.com/video/${vimeo[1]}`, provider: "vimeo", label: "Vimeo" };

  // Facebook video/reels/watch
  if (/facebook\.com\/.+\/(videos|reel)\/|facebook\.com\/watch\/?\?v=|fb\.watch\//i.test(url)) {
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
    return { src, provider: "facebook", label: "Facebook" };
  }

  // Instagram reel / post / tv
  const ig = url.match(/instagram\.com\/(?:reel|p|tv)\/([\w-]+)/);
  if (ig) return { src: `https://www.instagram.com/p/${ig[1]}/embed`, provider: "instagram", label: "Instagram" };

  // TikTok
  const tt = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (tt) return { src: `https://www.tiktok.com/embed/v2/${tt[1]}`, provider: "tiktok", label: "TikTok" };

  // Dailymotion
  const dm = url.match(/dailymotion\.com\/(?:video|embed\/video)\/([\w]+)/) || url.match(/dai\.ly\/([\w]+)/);
  if (dm) return { src: `https://www.dailymotion.com/embed/video/${dm[1]}`, provider: "dailymotion", label: "Dailymotion" };

  // Google Drive (public file)
  const gd = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) return { src: `https://drive.google.com/file/d/${gd[1]}/preview`, provider: "googledrive", label: "Google Drive" };

  // Twitch VOD or channel
  const twVod = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (twVod) return { src: `https://player.twitch.tv/?video=${twVod[1]}&parent=${host()}`, provider: "twitch", label: "Twitch" };
  const twCh = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/);
  if (twCh) return { src: `https://player.twitch.tv/?channel=${twCh[1]}&parent=${host()}`, provider: "twitch", label: "Twitch" };

  return null;
}

// Back-compat default: returns just the embed src string (or null) for existing call sites.
export function getVideoEmbedUrl(url: string): string | null {
  return parseVideoUrl(url)?.src ?? null;
}

// ─── Validation & normalization ─────────────────────────────────────────────
// Robust check that catches the common ways people paste broken/unsupported links:
// - empty / whitespace
// - not a URL / missing scheme
// - http (many embeds require https)
// - shortener that hasn't been expanded (bit.ly, t.co, lnkd.in) — we can't resolve those client-side
// - provider host we know about but URL shape is wrong (e.g. youtube.com without ?v=, drive without file/d/, tiktok without /video/)
// - completely unsupported provider

export type VideoValidation =
  | { ok: true; provider: VideoProvider; label: string; normalizedUrl: string; embedSrc: string }
  | { ok: false; error: string; hint?: string };

const KNOWN_HOST_HINTS: { match: RegExp; provider: string; hint: string }[] = [
  { match: /(^|\.)youtube\.com$|^youtu\.be$|(^|\.)youtube-nocookie\.com$/i, provider: "YouTube",
    hint: "Use the full watch link, e.g. https://youtu.be/VIDEO_ID or https://www.youtube.com/watch?v=VIDEO_ID" },
  { match: /(^|\.)vimeo\.com$/i, provider: "Vimeo",
    hint: "Use the public video link, e.g. https://vimeo.com/123456789" },
  { match: /(^|\.)facebook\.com$|^fb\.watch$/i, provider: "Facebook",
    hint: "Use a Facebook video/reel URL, e.g. https://www.facebook.com/USER/videos/123456789" },
  { match: /(^|\.)instagram\.com$/i, provider: "Instagram",
    hint: "Use a Reel or post URL, e.g. https://www.instagram.com/reel/SHORTCODE/" },
  { match: /(^|\.)tiktok\.com$/i, provider: "TikTok",
    hint: "Use the full video link, e.g. https://www.tiktok.com/@user/video/1234567890" },
  { match: /(^|\.)dailymotion\.com$|^dai\.ly$/i, provider: "Dailymotion",
    hint: "Use https://www.dailymotion.com/video/xxxxxxx" },
  { match: /(^|\.)drive\.google\.com$/i, provider: "Google Drive",
    hint: "The file must be shared as 'Anyone with the link'. Use https://drive.google.com/file/d/FILE_ID/view" },
  { match: /(^|\.)twitch\.tv$/i, provider: "Twitch",
    hint: "Use a VOD or channel URL, e.g. https://www.twitch.tv/videos/123456789" },
];

const SHORTENERS = /^(bit\.ly|t\.co|lnkd\.in|tinyurl\.com|goo\.gl|ow\.ly|is\.gd|buff\.ly)$/i;

// Strip tracking params and canonicalize a few common cases.
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    const drop = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid","igshid","si","feature","app","_r","_t","source","ref","ref_src"];
    for (const k of drop) u.searchParams.delete(k);
    // youtu.be/ID → youtube.com/watch?v=ID
    if (/^youtu\.be$/i.test(u.hostname)) {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    // youtube.com/shorts/ID or /live/ID → watch?v=ID (canonical)
    if (/(^|\.)youtube\.com$/i.test(u.hostname)) {
      const m = u.pathname.match(/^\/(shorts|live|embed)\/([\w-]{6,})/);
      if (m) return `https://www.youtube.com/watch?v=${m[2]}`;
    }
    return u.toString();
  } catch {
    return raw.trim();
  }
}

export function validateVideoUrl(raw: string): VideoValidation {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { ok: false, error: "Please paste a video URL." };

  // Basic URL shape
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL.", hint: "Paste the full link including https://" };
  }
  if (!/^https?:$/i.test(parsed.protocol)) {
    return { ok: false, error: "Only http/https links are supported." };
  }
  if (parsed.protocol === "http:") {
    return { ok: false, error: "Use the https:// version of this link — most players block http embeds." };
  }

  const host = parsed.hostname.toLowerCase();

  // Shorteners can't be resolved in the browser — ask for the expanded link.
  if (SHORTENERS.test(host)) {
    return { ok: false, error: "Short links can't be embedded.", hint: "Open the short link and paste the full destination URL." };
  }

  const normalized = normalizeUrl(parsed.toString());
  const parsedEmbed = parseVideoUrl(normalized);
  if (parsedEmbed) {
    return { ok: true, provider: parsedEmbed.provider, label: parsedEmbed.label, normalizedUrl: normalized, embedSrc: parsedEmbed.src };
  }

  // Known host but wrong shape — give a targeted hint.
  for (const h of KNOWN_HOST_HINTS) {
    if (h.match.test(host)) {
      return { ok: false, error: `This ${h.provider} link isn't in a supported format.`, hint: h.hint };
    }
  }

  return {
    ok: false,
    error: "This video host isn't supported.",
    hint: `Supported: ${SUPPORTED_VIDEO_PROVIDERS.map((p) => p.label).join(", ")}.`,
  };
}