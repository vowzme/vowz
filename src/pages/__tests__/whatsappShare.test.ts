import { describe, it, expect } from "vitest";
import { buildWhatsappShareUrl } from "../CardTemplatesPreview";

const ORIGIN = "https://vowz.me";
const tpl = { slug: "rose-gold", name: "Rose & Gold" } as any;

function decodeText(url: string) {
  const text = url.split("?text=")[1];
  return decodeURIComponent(text);
}

describe("buildWhatsappShareUrl", () => {
  it("encodes PDF format and template name", () => {
    const url = buildWhatsappShareUrl(tpl, "pdf", ORIGIN);
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    const msg = decodeText(url);
    expect(msg).toContain('"Rose & Gold"');
    expect(msg).toContain("download it as PDF");
    expect(msg).toContain(`${ORIGIN}/card-templates-preview?slug=rose-gold&format=pdf`);
  });

  it("encodes Image (PNG) format", () => {
    const url = buildWhatsappShareUrl(tpl, "image", ORIGIN);
    const msg = decodeText(url);
    expect(msg).toContain("Image (PNG)");
    expect(msg).toContain("format=image");
  });

  it("omits format param when 'all'", () => {
    const url = buildWhatsappShareUrl(tpl, "all", ORIGIN);
    const msg = decodeText(url);
    expect(msg).toContain("PDF or Image");
    expect(msg).not.toContain("format=");
  });

  it("handles special characters in name (quotes, emoji, &, #, /)", () => {
    const tricky = { slug: "x", name: `Anaïs & "Jon" 💍 #1/2` } as any;
    const url = buildWhatsappShareUrl(tricky, "pdf", ORIGIN);
    // Raw URL must not contain unencoded breaking chars in the text portion
    const text = url.split("?text=")[1];
    expect(text).not.toContain('"');
    expect(text).not.toContain("#");
    expect(text).not.toContain(" ");
    const msg = decodeText(url);
    expect(msg).toContain(`"Anaïs & "Jon" 💍 #1/2"`);
  });

  it("encodes slugs with special chars via URLSearchParams", () => {
    const t = { slug: "a b&c", name: "X" } as any;
    const url = buildWhatsappShareUrl(t, "image", ORIGIN);
    const msg = decodeText(url);
    expect(msg).toContain("slug=a+b%26c");
    expect(msg).toContain("format=image");
  });
});