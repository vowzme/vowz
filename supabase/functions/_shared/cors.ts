// Shared CORS allowlist for edge functions.
// Production origins come from env vars so updates don't require editing each function:
//   ALLOWED_ORIGINS         = comma-separated exact origins (e.g. "https://vowz.me,https://www.vowz.me")
//   ALLOWED_ORIGIN_PATTERNS = comma-separated regex sources (e.g. "^https://id-preview--[a-z0-9-]+\\.lovable\\.app$")
// Defaults preserve current production + Lovable preview behavior.

const DEFAULT_ORIGINS = [
  "https://vowz.me",
  "https://www.vowz.me",
  "https://vowz.lovable.app",
];

const DEFAULT_PATTERNS = [
  String.raw`^https:\/\/id-preview--[a-z0-9-]+\.lovable\.app$`,
  String.raw`^https:\/\/[a-z0-9-]+\.lovableproject\.com$`,
];

function parseList(v: string | undefined): string[] {
  return (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const envOrigins = parseList(Deno.env.get("ALLOWED_ORIGINS"));
const envPatterns = parseList(Deno.env.get("ALLOWED_ORIGIN_PATTERNS"));

export const ALLOWED_ORIGINS = new Set(
  envOrigins.length ? envOrigins : DEFAULT_ORIGINS,
);

export const ALLOWED_ORIGIN_PATTERNS: RegExp[] = (
  envPatterns.length ? envPatterns : DEFAULT_PATTERNS
).map((src) => {
  try {
    return new RegExp(src, "i");
  } catch {
    return null;
  }
}).filter((r): r is RegExp => r !== null);

export const FALLBACK_ORIGIN =
  Deno.env.get("CORS_FALLBACK_ORIGIN") ||
  [...ALLOWED_ORIGINS][0] ||
  "https://vowz.me";

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  return (
    ALLOWED_ORIGINS.has(origin) ||
    ALLOWED_ORIGIN_PATTERNS.some((r) => r.test(origin))
  );
}

export interface BuildCorsOptions {
  methods?: string;
  headers?: string;
}

const DEFAULT_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function buildCors(
  req: Request,
  opts: BuildCorsOptions = {},
): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : FALLBACK_ORIGIN,
    "Access-Control-Allow-Headers": opts.headers ?? DEFAULT_HEADERS,
    "Access-Control-Allow-Methods": opts.methods ?? "POST, OPTIONS",
    Vary: "Origin",
  };
}