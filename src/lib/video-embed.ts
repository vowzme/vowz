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