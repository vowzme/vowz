/**
 * Validates PWA icon assets:
 *  - PNG dimensions match declared manifest sizes
 *  - Maskable PNGs keep their opaque content inside Android's 80% safe zone
 *  - Adaptive SVG files exist and declare a square viewBox
 *
 * Run: bunx tsx scripts/validate-icons.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd(), "public");
const MANIFEST = JSON.parse(
  readFileSync(resolve(ROOT, "manifest.webmanifest"), "utf8"),
) as { icons: Array<{ src: string; sizes: string; type: string; purpose?: string }> };

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

// ---------- PNG helpers (8-bit RGBA, non-interlaced) ----------
function readPngIhdr(buf: Buffer) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25],
    interlace: buf[28],
  };
}

function decodePngRgba(buf: Buffer) {
  const ihdr = readPngIhdr(buf);
  // Support 8-bit RGB (colorType 2) and RGBA (colorType 6), non-interlaced.
  if (ihdr.bitDepth !== 8 || (ihdr.colorType !== 6 && ihdr.colorType !== 2) || ihdr.interlace !== 0) {
    throw new Error(`unsupported PNG format (bd=${ihdr.bitDepth} ct=${ihdr.colorType})`);
  }
  const channels = ihdr.colorType === 6 ? 4 : 3;
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
  const stride = w * channels;
  const decoded = Buffer.alloc(w * h * channels);
  let src = 0;
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const filter = raw[src++];
    const rowStart = y * stride;
    const prevRow = y === 0 ? null : rowStart - stride;
    for (let x = 0; x < stride; x++) {
      const v = raw[src++];
      const left = x >= channels ? decoded[rowStart + x - channels] : 0;
      const up = prevRow !== null ? decoded[prevRow + x] : 0;
      const ul = prevRow !== null && x >= channels ? decoded[prevRow + x - channels] : 0;
      let recon: number;
      switch (filter) {
        case 0: recon = v; break;
        case 1: recon = v + left; break;
        case 2: recon = v + up; break;
        case 3: recon = v + ((left + up) >> 1); break;
        case 4: recon = v + paeth(left, up, ul); break;
        default: throw new Error(`unknown filter ${filter}`);
      }
      decoded[rowStart + x] = recon & 0xff;
    }
  }
  // Normalise to RGBA so downstream code can assume 4 channels.
  if (channels === 4) return { width: w, height: h, pixels: decoded };
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0, j = 0; i < decoded.length; i += 3, j += 4) {
    rgba[j] = decoded[i];
    rgba[j + 1] = decoded[i + 1];
    rgba[j + 2] = decoded[i + 2];
    rgba[j + 3] = 255;
  }
  return { width: w, height: h, pixels: rgba };
}

function contentBounds(img: { width: number; height: number; pixels: Buffer }) {
  // Content = pixel that differs from the corner (background) color.
  const { width: w, height: h, pixels } = img;
  const [br, bg, bb] = [pixels[0], pixels[1], pixels[2]];
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dr = pixels[i] - br, dg = pixels[i + 1] - bg, db = pixels[i + 2] - bb;
      if (dr * dr + dg * dg + db * db > 24) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

// ---------- Checks ----------
for (const icon of MANIFEST.icons) {
  const file = resolve(ROOT, icon.src.replace(/\?.*$/, "").replace(/^\//, ""));
  if (!existsSync(file)) { fail(`missing asset: ${icon.src}`); continue; }
  const buf = readFileSync(file);

  if (icon.type === "image/svg+xml") {
    const s = buf.toString("utf8");
    if (!/<svg[^>]*\bviewBox\s*=/.test(s)) fail(`${icon.src}: SVG missing viewBox`);
    continue;
  }

  const { width, height } = readPngIhdr(buf);
  if (width !== height) fail(`${icon.src}: not square (${width}x${height})`);
  const [declaredW, declaredH] = icon.sizes.split("x").map(Number);
  if (width !== declaredW || height !== declaredH) {
    fail(`${icon.src}: size mismatch (declared ${icon.sizes}, actual ${width}x${height})`);
  }

  const purposes = (icon.purpose ?? "any").split(/\s+/);
  if (purposes.includes("maskable")) {
    const img = decodePngRgba(buf);
    const bounds = contentBounds(img);
    if (!bounds) { fail(`${icon.src}: maskable icon has no visible content`); continue; }
    // 80% safe zone: content must fit inside centered box of side 0.8 * width.
    const margin = width * 0.1;
    const safeMin = margin, safeMax = width - margin;
    if (
      bounds.minX < safeMin || bounds.minY < safeMin ||
      bounds.maxX > safeMax || bounds.maxY > safeMax
    ) {
      fail(
        `${icon.src}: content [${bounds.minX},${bounds.minY}-${bounds.maxX},${bounds.maxY}] ` +
        `escapes 80% safe zone [${safeMin.toFixed(0)}-${safeMax.toFixed(0)}]`,
      );
    } else {
      const usedPct = (((bounds.maxX - bounds.minX) / width) * 100).toFixed(0);
      console.log(`ok  maskable ${icon.src} (${width}px, content ${usedPct}% of canvas)`);
    }
  } else {
    console.log(`ok  ${icon.purpose ?? "any"}      ${icon.src} (${width}x${height})`);
  }
}

if (errors.length) {
  console.error(`\n${errors.length} icon issue(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("\nAll icon assets valid.");