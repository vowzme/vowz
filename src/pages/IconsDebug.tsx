import { useEffect, useState } from "react";

type IconRow = { label: string; url: string; status?: string; type?: string; size?: string };

async function head(url: string) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    const buf = await r.arrayBuffer();
    return {
      status: `${r.status} ${r.statusText}`,
      type: r.headers.get("content-type") || "—",
      size: `${buf.byteLength} B`,
    };
  } catch (e: any) {
    return { status: `error: ${e?.message ?? e}`, type: "—", size: "—" };
  }
}

export default function IconsDebug() {
  const [rows, setRows] = useState<IconRow[]>([]);
  const [manifest, setManifest] = useState<any>(null);

  useEffect(() => {
    const head_links = Array.from(
      document.querySelectorAll<HTMLLinkElement>(
        'link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"], link[rel="manifest"]'
      )
    );
    const base: IconRow[] = head_links.map((l) => ({
      label: `<link rel="${l.rel}">`,
      url: l.href,
    }));

    (async () => {
      const enriched = await Promise.all(
        base.map(async (r) => ({ ...r, ...(await head(r.url)) }))
      );
      // Manifest icons
      try {
        const m = await fetch("/manifest.webmanifest", { cache: "no-store" }).then((r) => r.json());
        setManifest(m);
        const mi: IconRow[] = await Promise.all(
          (m.icons || []).map(async (ic: any) => ({
            label: `manifest icon (${ic.sizes} ${ic.purpose || "any"})`,
            url: new URL(ic.src, window.location.origin).href,
            ...(await head(new URL(ic.src, window.location.origin).href)),
          }))
        );
        setRows([...enriched, ...mi]);
      } catch {
        setRows(enriched);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-4">Icon & Manifest Debug</h1>
      <p className="mb-4 opacity-70">
        Origin: <code>{window.location.origin}</code>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2">Label</th>
              <th className="text-left p-2">URL</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Size</th>
              <th className="text-left p-2">Preview</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="p-2 whitespace-nowrap">{r.label}</td>
                <td className="p-2 break-all">
                  <a href={r.url} target="_blank" rel="noreferrer" className="underline">
                    {r.url}
                  </a>
                </td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.type}</td>
                <td className="p-2">{r.size}</td>
                <td className="p-2">
                  {r.type?.startsWith("image/") ? (
                    <img src={r.url} alt="" className="h-10 w-10 object-contain bg-black/10 rounded" />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {manifest && (
        <>
          <h2 className="text-lg font-bold mt-8 mb-2">manifest.webmanifest</h2>
          <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}