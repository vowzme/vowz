// Helpers for building & validating social share URLs.
// Extracted from CustomSlugEditor so we can unit-test WhatsApp encoding
// across every slug/URL format we support.

export type Utm = {
  source?: string;
  medium?: string;
  campaign?: string;
};

/** Append UTM params (if any) to a URL, preserving existing query. */
export function withUtm(rawUrl: string, utm: Utm = {}): string {
  const u = new URL(rawUrl); // throws on invalid — caller validates first
  if (utm.source)   u.searchParams.set("utm_source", utm.source);
  if (utm.medium)   u.searchParams.set("utm_medium", utm.medium);
  if (utm.campaign) u.searchParams.set("utm_campaign", utm.campaign);
  return u.toString();
}

/**
 * Build a wa.me share link that encodes the target URL safely.
 * Uses encodeURIComponent so `&`, `?`, `#`, spaces, unicode, and existing
 * query strings all round-trip through WhatsApp's `text=` parameter.
 */
export function buildWhatsAppShareUrl(targetUrl: string, utm: Utm = {}): string {
  if (!isValidHttpUrl(targetUrl)) {
    throw new Error(`buildWhatsAppShareUrl: invalid URL "${targetUrl}"`);
  }
  const tracked = Object.keys(utm).length ? withUtm(targetUrl, utm) : targetUrl;
  return `https://wa.me/?text=${encodeURIComponent(tracked)}`;
}

/** Only accept absolute http(s) URLs. */
export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}