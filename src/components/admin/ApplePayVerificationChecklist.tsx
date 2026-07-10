import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Apple, Check, Copy, ExternalLink, Loader2, RefreshCw, X } from "lucide-react";

const FILE_PATH = "/.well-known/apple-developer-merchantid-domain-association";

const DOMAINS = [
  { host: "vowz.me", label: "Primary domain" },
  { host: "www.vowz.me", label: "www subdomain" },
  { host: "vowz.lovable.app", label: "Lovable published URL" },
];

type CheckState = "idle" | "checking" | "ok" | "fail";

interface Result {
  state: CheckState;
  status?: number;
  error?: string;
}

export default function ApplePayVerificationChecklist() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [checking, setChecking] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    const next: Record<string, Result> = {};
    await Promise.all(
      DOMAINS.map(async ({ host }) => {
        const url = `https://${host}${FILE_PATH}`;
        next[host] = { state: "checking" };
        try {
          // no-cors so we at least know the file responds; opaque responses
          // won't give status codes, so fall back to a text fetch attempt.
          const res = await fetch(url, { method: "GET", mode: "cors" });
          if (res.ok) {
            const text = await res.text();
            next[host] = text.trim().length > 0
              ? { state: "ok", status: res.status }
              : { state: "fail", status: res.status, error: "Empty response" };
          } else {
            next[host] = { state: "fail", status: res.status, error: `HTTP ${res.status}` };
          }
        } catch (e: any) {
          // CORS may block reads even when the file exists. Do a no-cors ping.
          try {
            await fetch(url, { method: "GET", mode: "no-cors" });
            next[host] = { state: "ok", error: "Reachable (opaque)" };
          } catch (err: any) {
            next[host] = { state: "fail", error: err?.message || "Unreachable" };
          }
        }
      })
    );
    setResults(next);
    setChecking(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: text });
  };

  return (
    <Card className="border-border/50 max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(var(--maroon-light))] flex items-center justify-center">
            <Apple className="w-5 h-5 text-[hsl(var(--gold))]" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Apple Pay Domain Verification</CardTitle>
            <CardDescription className="font-body">
              Steps to verify your domain with Razorpay for Apple Pay.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ol className="space-y-3 text-sm font-body">
          <li className="flex gap-3">
            <Badge variant="outline" className="h-6">1</Badge>
            <div>
              File is committed at{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                public{FILE_PATH}
              </code>
              . <strong>Click Publish</strong> in Lovable so it goes live.
            </div>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="h-6">2</Badge>
            <div>
              Verify each URL below returns the file (200 OK, plain text, no redirect).
            </div>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="h-6">3</Badge>
            <div>
              In Razorpay Dashboard → Apple Pay → <em>Register domain</em>, enter{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">vowz.me</code>{" "}
              (repeat for <code className="text-xs bg-muted px-1.5 py-0.5 rounded">www.vowz.me</code>) and click Verify.
            </div>
          </li>
        </ol>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-sm font-semibold">URLs to verify</h4>
            <Button variant="ghost" size="sm" onClick={runChecks} disabled={checking}>
              {checking ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
              )}
              Re-check
            </Button>
          </div>
          {DOMAINS.map(({ host, label }) => {
            const r = results[host];
            const url = `https://${host}${FILE_PATH}`;
            return (
              <div
                key={host}
                className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
              >
                <div className="shrink-0">
                  {!r || r.state === "checking" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : r.state === "ok" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-sm truncate font-mono">{url}</div>
                  {r?.error && r.state === "fail" && (
                    <div className="text-xs text-destructive">{r.error}</div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(url)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground font-body">
          Note: browser CORS may block reading the file body — an "opaque" result still means
          the URL is reachable. The definitive check is Razorpay's Verify button.
        </p>
      </CardContent>
    </Card>
  );
}