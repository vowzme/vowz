import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";

const ASSETLINKS_URL = "https://vowz.me/.well-known/assetlinks.json";
const EXPECTED_PACKAGE = "me.vowz.twa";
const EXPECTED_FINGERPRINT =
  "63:1D:D6:54:03:96:C2:49:49:1A:69:BC:0D:80:7F:B7:37:8C:54:DA:3A:FB:0B:3D:2B:AF:F5:AB:BD:60:C9:DD";

type Check = { label: string; pass: boolean; detail?: string };
type Result = { ok: boolean; checks: Check[]; raw?: string; error?: string };

export default function TwaVerify() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${ASSETLINKS_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });
      const text = await res.text();
      const checks: Check[] = [];
      checks.push({
        label: "HTTP 200 OK",
        pass: res.status === 200,
        detail: `status ${res.status}`,
      });
      const ct = res.headers.get("content-type") || "";
      checks.push({
        label: "Content-Type is JSON",
        pass: ct.includes("json"),
        detail: ct || "missing",
      });

      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        checks.push({ label: "Valid JSON", pass: false, detail: (e as Error).message });
        setResult({ ok: false, checks, raw: text });
        return;
      }
      checks.push({ label: "Valid JSON", pass: true });

      const arr = Array.isArray(parsed) ? parsed : [];
      checks.push({
        label: "Non-empty array",
        pass: arr.length > 0,
        detail: `${arr.length} entrie(s)`,
      });

      const entry = arr[0] || {};
      const rel = entry?.relation || [];
      checks.push({
        label: "Relation delegate_permission/common.handle_all_urls",
        pass:
          Array.isArray(rel) &&
          rel.includes("delegate_permission/common.handle_all_urls"),
      });
      checks.push({
        label: "Namespace android_app",
        pass: entry?.target?.namespace === "android_app",
        detail: entry?.target?.namespace,
      });
      checks.push({
        label: `Package name ${EXPECTED_PACKAGE}`,
        pass: entry?.target?.package_name === EXPECTED_PACKAGE,
        detail: entry?.target?.package_name,
      });
      const fps: string[] = entry?.target?.sha256_cert_fingerprints || [];
      const shaRe = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;
      checks.push({
        label: "SHA-256 fingerprint format",
        pass: fps.length > 0 && fps.every((f) => shaRe.test(f)),
        detail: fps.join(", ") || "none",
      });
      checks.push({
        label: "Fingerprint matches signing key",
        pass: fps.includes(EXPECTED_FINGERPRINT),
        detail: fps.includes(EXPECTED_FINGERPRINT)
          ? "match"
          : `expected ${EXPECTED_FINGERPRINT}`,
      });

      setResult({
        ok: checks.every((c) => c.pass),
        checks,
        raw: text,
      });
    } catch (e) {
      setResult({
        ok: false,
        checks: [],
        error: (e as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">TWA / Digital Asset Links Verification</h1>
          <p className="text-muted-foreground mt-2">
            One-click check of{" "}
            <a
              href={ASSETLINKS_URL}
              target="_blank"
              rel="noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              {ASSETLINKS_URL}
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <Button onClick={run} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking…
            </>
          ) : (
            "Run verification"
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.ok ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    All checks passed
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-destructive" />
                    Verification failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.error && (
                <p className="text-sm text-destructive">Error: {result.error}</p>
              )}
              <ul className="space-y-2">
                {result.checks.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {c.pass ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    )}
                    <span>
                      <span className="font-medium">{c.label}</span>
                      {c.detail && (
                        <span className="text-muted-foreground"> — {c.detail}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {result.raw && (
                <details className="mt-4">
                  <summary className="text-sm cursor-pointer text-muted-foreground">
                    Raw response
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {result.raw}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}