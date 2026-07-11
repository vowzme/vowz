/**
 * Verifies every install-time PNG (PWA icons + iOS splash) has an opaque,
 * near-white background — so a future edit can't silently reintroduce the
 * old navy/black backdrop.
 *
 * Checks: 4 corners + 4 edge midpoints of each PNG are opaque AND each
 * channel >= 210 (allows the subtle #ECEEF2 gloss gradient, rejects any
 * grey/black/navy fill).
 *
 * Run: bunx tsx scripts/validate-white-glossy.ts
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { resolve, join } from "node:path";

const ROOT = resolve(process.cwd(), "public");
const MIN_CHANNEL = 210; // white gloss floor — bottom vignette is ~ (210,214,222)

// Files that render at PWA install time / iOS home-screen / splash.
// Excludes browser-tab favicons (favicon-dark-*.png) which are legitimately transparent.
const ICONS_DIR = join(ROOT, "icons");
const SPLASH_DIR = join(ROOT, "splash");
const iconFiles = existsSync(ICONS_DIR)
  ? readdirSync(ICONS_DIR)
      .filter((f) => f.endsWith(".png") && !f.startsWith("favicon"))
      .map((f) => join(ICONS_DIR, f))
  : [];
const splashFiles = existsSync(SPLASH_DIR)
  ? readdirSync(SPLASH_DIR).filter((f) => f.endsWith(".png")).map((f) => join(SPLASH_DIR, f))
  : [];

function readIhdr(buf: Buffer) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25], // 2 = RGB, 6 = RGBA
    interlace: buf[28],
  };
}

function decodePng(buf: Buffer) {
  const ihdr = readIhdr(buf);
  if (ihdr.bitDepth !== 8 || ihdr.interlace !== 0 || (ihdr.colorType !== 2 && ihdr.colorType !== 6)) {
    throw new Error(`unsupported PNG (bd=${ihdr.bitDepth} ct=${ihdr.colorType})`);
  }
  const bpp = ihdr.colorType === 6 ? 4 : 3;
  const chunks: Buffer[] = [];
  let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.subarray(p + 4, p + 8).toString("ascii");
    if (type === "IDAT") chunks.push(buf.subarray(p + 8, p + 8 + len));
    if (type === "IEND") break;
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const { width: w, height: h } = ihdr;
  const stride = w * bpp;
  const out = Buffer.alloc(w * h * bpp);
  let src = 0;
  const paeth = (a: number, b: number, c: number) => {
    const pv = a + b - c;
    const pa = Math.abs(pv - a), pb = Math.abs(pv - b), pc = Math.abs(pv - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const filter = raw[src++];
    const rowStart = y * stride;
    const prevRow = y === 0 ? -1 : rowStart - stride;
    for (let x = 0; x < stride; x++) {
      const v = raw[src++];
      const left = x >= bpp ? out[rowStart + x - bpp] : 0;
      const up = prevRow >= 0 ? out[prevRow + x] : 0;
      const ul = prevRow >= 0 && x >= bpp ? out[prevRow + x - bpp] : 0;
      let recon: number;
      switch (filter) {
        case 0: recon = v; break;
        case 1: recon = v + left; break;
        case 2: recon = v + up; break;
        case 3: recon = v + ((left + up) >> 1); break;
        case 4: recon = v + paeth(left, up, ul); break;
        default: throw new Error(`unknown filter ${filter}`);
      }
      out[rowStart + x] = recon & 0xff;
    }
  }
  return { width: w, height: h, bpp, pixels: out };
}

function px(img: { width: number; bpp: number; pixels: Buffer }, x: number, y: number) {
  const i = (y * img.width + x) * img.bpp;
  const r = img.pixels[i], g = img.pixels[i + 1], b = img.pixels[i + 2];
  const a = img.bpp === 4 ? img.pixels[i + 3] : 255;
  return { r, g, b, a };
}

const errors: string[] = [];
const all = [...iconFiles, ...splashFiles].sort();

for (const file of all) {
  const rel = file.replace(process.cwd() + "/", "");
  let img;
  try {
    img = decodePng(readFileSync(file));
  } catch (e) {
    errors.push(`${rel}: decode failed — ${(e as Error).message}`);
    continue;
  }
  const { width: w, height: h } = img;
  const samples: Array<[string, number, number]> = [
    ["TL", 0, 0], ["TR", w - 1, 0], ["BL", 0, h - 1], ["BR", w - 1, h - 1],
    ["T",  w >> 1, 0], ["B", w >> 1, h - 1],
    ["L",  0, h >> 1], ["R", w - 1, h >> 1],
  ];
  const bad: string[] = [];
  for (const [label, x, y] of samples) {
    const { r, g, b, a } = px(img, x, y);
    if (a < 255) bad.push(`${label}=alpha${a}`);
    else if (r < MIN_CHANNEL || g < MIN_CHANNEL || b < MIN_CHANNEL)
      bad.push(`${label}=rgb(${r},${g},${b})`);
  }
  if (bad.length) {
    errors.push(`${rel}: non-white/transparent background at ${bad.join(", ")}`);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} install-icon/splash regression(s):\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ ${all.length} install icons + splash images have opaque white-glossy backgrounds`);