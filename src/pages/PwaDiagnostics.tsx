import { useEffect, useState } from "react";

type Row = {
  label: string;
  url: string;
  media?: string;
  status?: string;
  type?: string;
  size?: string;
  opacity?: string;
  bgSample?: string;
  verdict?: "OK" | "FAIL" | "?";
};

const MIN_CHANNEL = 210; // matches scripts/validate-white-glossy.ts

async function fetchInfo(url: string) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    const buf = await r.arrayBuffer();
    return {
      status: `${r.status}`,
      type: r.headers.get("content-type") || "—",
      size: `${buf.byteLength} B`,
    };
  } catch (e: unknown) {
    return { status: `err`, type: "—", size: "—" };
  }
}

/** Load PNG and sample 8 edge points; return corner color + opacity verdict. */
function inspectImage(url: string): Promise<Pick<Row, "opacity" | "bgSample" | "verdict">> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight;
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const pts: Array<[number, number]> = [
          [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
          [w >> 1, 0], [w >> 1, h - 1], [0, h >> 1], [w - 1, h >> 1],
        ];
        let minA = 255, minCh = 255;
        for (const [x, y] of pts) {
          const d = ctx.getImageData(x, y, 1, 1).data;
          minA = Math.min(minA, d[3]);
          minCh = Math.min(minCh, d[0], d[1], d[2]);
        }
        const [r0, g0, b0, a0] = Array.from(
          ctx.getImageData(0, 0, 1, 1).data
        );
        const opaque = minA === 255;
        const white = minCh >= MIN_CHANNEL;
        resolve({
          opacity: `α min ${minA}`,
          bgSample: `rgba(${r0},${g0},${b0},${a0})`,
          verdict: opaque && white ? "OK" : "FAIL",
        });
      } catch {
        resolve({ opacity: "tainted", bgSample: "—", verdict: "?" });
      }
    };
    img.onerror = () => resolve({ opacity: "load err", bgSample: "—", verdict: "?" });
    img.src = url;
  });
}

export default function PwaDiagnostics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [themeColors, setThemeColors] = useState<Array<{ media: string; content: string }>>([]);
  const [manifest, setManifest] = useState<any>(null);
  const [statusBarStyle, setStatusBarStyle] = useState("");

  useEffect(() => {
    // Extract head metadata driving install appearance
    const themes = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    ).map((m) => ({ media: m.media || "(all)", content: m.content }));
    setThemeColors(themes);
    setStatusBarStyle(
      document
        .querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.content || "—"
    );

    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>(
        'link[rel="apple-touch-icon"], link[rel="apple-touch-startup-image"], link[rel="mask-icon"], link[rel="icon"]'
      )
    );
    const base: Row[] = links.map((l) => ({
      label: `<link rel="${l.rel}"${l.sizes?.value ? ` sizes="${l.sizes.value}"` : ""}>`,
      url: l.href,
      media: l.media || "",
    }));

    (async () => {
      const m = await fetch("/manifest.webmanifest", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null);
      setManifest(m);
      const manifestRows: Row[] = (m?.icons || []).map((ic: any) => ({
        label: `manifest icon (${ic.sizes} ${ic.purpose || "any"})`,
        url: new URL(ic.src, window.location.origin).href,
      }));
      const all = [...base, ...manifestRows];
      const enriched = await Promise.all(
        all.map(async (r) => {
          const info = await fetchInfo(r.url);
          const inspect =
            info.type.startsWith("image/") && !info.type.includes("svg")
              ? await inspectImage(r.url)
              : { opacity: "—", bgSample: "—", verdict: "?" as const };
          return { ...r, ...info, ...inspect };
        })
      );
      setRows(enriched);
    })();
  }, []);

  const fails = rows.filter((r) => r.verdict === "FAIL");

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-4">PWA Diagnostics</h1>

      <section className="mb-6">
        <h2 className="text-base font-bold mb-2">Head metadata</h2>
        <table className="w-full text-xs">
          <tbody>
            <tr><td className="pr-4 opacity-70">origin</td><td>{window.location.origin}</td></tr>
            <tr><td className="pr-4 opacity-70">apple status-bar-style</td><td>{statusBarStyle}</td></tr>
            {themeColors.map((t, i) => (
              <tr key={i}>
                <td className="pr-4 opacity-70">theme-color <em>{t.media}</em></td>
                <td>
                  <span
                    className="inline-block w-4 h-4 mr-2 align-middle border border-border"
                    style={{ background: t.content }}
                  />
                  {t.content}
                </td>
              </tr>
            ))}
            {manifest && (
              <>
                <tr>
                  <td className="pr-4 opacity-70">manifest.background_color</td>
                  <td>
                    <span
                      className="inline-block w-4 h-4 mr-2 align-middle border border-border"
                      style={{ background: manifest.background_color }}
                    />
                    {manifest.background_color} (iOS/Android splash canvas)
                  </td>
                </tr>
                <tr>
                  <td className="pr-4 opacity-70">manifest.theme_color</td>
                  <td>
                    <span
                      className="inline-block w-4 h-4 mr-2 align-middle border border-border"
                      style={{ background: manifest.theme_color }}
                    />
                    {manifest.theme_color} (Android status bar)
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </section>

      <section className="mb-4">
        <h2 className="text-base font-bold mb-2">
          Icons & splash ({rows.length}){" "}
          <span className={fails.length ? "text-destructive" : "text-emerald-600"}>
            — {fails.length ? `${fails.length} FAIL` : "all OK"}
          </span>
        </h2>
        <p className="mb-2 text-xs opacity-70">
          Verdict: corner opacity α=255 AND each RGB channel ≥ {MIN_CHANNEL} (matches CI validator).
        </p>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2">Rel</th>
              <th className="text-left p-2">URL</th>
              <th className="text-left p-2">Media</th>
              <th className="text-left p-2">HTTP</th>
              <th className="text-left p-2">Corner rgba</th>
              <th className="text-left p-2">α min</th>
              <th className="text-left p-2">Verdict</th>
              <th className="text-left p-2">Preview</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="p-2 whitespace-nowrap">{r.label}</td>
                <td className="p-2 break-all max-w-xs">
                  <a href={r.url} target="_blank" rel="noreferrer" className="underline">
                    {r.url.replace(window.location.origin, "")}
                  </a>
                </td>
                <td className="p-2 opacity-70">{r.media || "—"}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2 whitespace-nowrap">{r.bgSample}</td>
                <td className="p-2">{r.opacity}</td>
                <td
                  className={`p-2 font-bold ${
                    r.verdict === "OK"
                      ? "text-emerald-600"
                      : r.verdict === "FAIL"
                      ? "text-destructive"
                      : "opacity-60"
                  }`}
                >
                  {r.verdict}
                </td>
                <td className="p-2">
                  {r.type?.startsWith("image/") ? (
                    <img
                      src={r.url}
                      alt=""
                      className="h-10 w-10 object-contain rounded"
                      style={{ background: "repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0/12px 12px" }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}