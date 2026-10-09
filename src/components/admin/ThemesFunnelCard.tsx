import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type F = { themes_visitors: number; pickers: number; creators: number };

/** Themes page → design picked → site created, counted by unique visitor. */
export default function ThemesFunnelCard({ days }: { days: number }) {
  const [f, setF] = useState<F | null>(null);
  useEffect(() => {
    (supabase as any).rpc("get_themes_funnel", { _days: days }).then(({ data }: any) => setF(data?.[0] ?? null));
  }, [days]);
  const base = Number(f?.themes_visitors ?? 0);
  const steps = [
    { label: "Visited Themes page", v: base },
    { label: "Picked a design", v: Number(f?.pickers ?? 0) },
    { label: "Created a site", v: Number(f?.creators ?? 0) },
  ];
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 1000) / 10}%` : "—");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Themes conversion</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {steps.map((s, i) => (
          <div key={s.label}>
            <div className="flex justify-between text-sm">
              <span>{s.label}</span>
              <span className="font-semibold">{s.v} {i > 0 && <span className="text-muted-foreground font-normal">· {pct(s.v, steps[i - 1].v)} of previous</span>}</span>
            </div>
            <div className="h-2 rounded bg-muted mt-1"><div className="h-2 rounded bg-primary" style={{ width: base ? `${(s.v / base) * 100}%` : "0%" }} /></div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Overall: {pct(steps[2].v, base)} of Themes visitors created a site.</p>
      </CardContent>
    </Card>
  );
}
