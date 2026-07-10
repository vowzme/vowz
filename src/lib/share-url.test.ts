import { describe, it, expect } from "vitest";
import { buildWhatsAppShareUrl, isValidHttpUrl, withUtm } from "./share-url";

function decodeText(waUrl: string): string {
  const u = new URL(waUrl);
  return u.searchParams.get("text") ?? "";
}

describe("buildWhatsAppShareUrl", () => {
  const cases: Array<[string, string]> = [
    ["simple slug",           "https://vowz.me/site/priya-anooj"],
    ["numeric slug",          "https://vowz.me/site/priya-anooj-2026"],
    ["hyphenated slug",       "https://vowz.me/site/a-b-c-d-e"],
    ["existing query string", "https://vowz.me/site/priya-anooj?ref=email&x=1"],
    ["url fragment",          "https://vowz.me/site/priya-anooj#rsvp"],
    ["unicode in path",       "https://vowz.me/site/प्रिया-अनूज"],
    ["preview subdomain",     "https://id-preview--abc.lovable.app/site/priya"],
    ["localhost with port",   "http://localhost:8080/site/priya-anooj"],
  ];

  it.each(cases)("encodes %s round-trip", (_label, url) => {
    const wa = buildWhatsAppShareUrl(url);
    expect(wa.startsWith("https://wa.me/?text=")).toBe(true);
    const rawText = wa.slice("https://wa.me/?text=".length);
    expect(rawText).not.toMatch(/[ #]/);
    expect(decodeText(wa)).toBe(url);
  });

  it("appends UTM params without breaking existing query", () => {
    const wa = buildWhatsAppShareUrl("https://vowz.me/site/priya-anooj?ref=email", {
      source: "whatsapp", medium: "share", campaign: "live_preview",
    });
    const decoded = new URL(decodeText(wa));
    expect(decoded.searchParams.get("ref")).toBe("email");
    expect(decoded.searchParams.get("utm_source")).toBe("whatsapp");
    expect(decoded.searchParams.get("utm_medium")).toBe("share");
    expect(decoded.searchParams.get("utm_campaign")).toBe("live_preview");
  });

  it("throws on invalid URLs", () => {
    expect(() => buildWhatsAppShareUrl("not a url")).toThrow();
    expect(() => buildWhatsAppShareUrl("javascript:alert(1)")).toThrow();
    expect(() => buildWhatsAppShareUrl("/site/priya")).toThrow();
  });
});

describe("isValidHttpUrl", () => {
  it("accepts http and https", () => {
    expect(isValidHttpUrl("https://vowz.me")).toBe(true);
    expect(isValidHttpUrl("http://localhost:8080/site/x")).toBe(true);
  });
  it("rejects everything else", () => {
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("mailto:a@b.com")).toBe(false);
    expect(isValidHttpUrl("/relative")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
  });
});

describe("withUtm", () => {
  it("is a no-op when no params supplied", () => {
    expect(withUtm("https://vowz.me/site/x")).toBe("https://vowz.me/site/x");
  });
  it("overrides duplicate utm keys", () => {
    const out = withUtm("https://vowz.me/site/x?utm_source=old", { source: "new" });
    expect(new URL(out).searchParams.get("utm_source")).toBe("new");
  });
});