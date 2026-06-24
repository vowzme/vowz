import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, CardCategory } from "@/lib/card-templates";

interface Row {
  id: string;
  slug: string;
  name: string;
  category: CardCategory;
  is_premium: boolean;
  is_enabled: boolean;
  sort_order: number;
  description: string | null;
}

export default function AdminCardTemplates() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("card_templates")
      .select("*")
      .order("sort_order");
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Row>) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await (supabase as any)
      .from("card_templates")
      .update(patch)
      .eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Invitation Card Templates</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Toggle availability and premium gating for built-in invitation card designs.
      </p>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
            <div key={t.id} className="bg-card border border-border/50 rounded-lg p-3 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <div className="font-display font-semibold">{t.name}</div>
                  <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[t.category]}</Badge>
                  {t.is_premium && <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">Premium</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                <div className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{t.slug}</div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                Premium
                <Switch checked={t.is_premium} onCheckedChange={(v) => update(t.id, { is_premium: v })} />
              </label>
              <label className="flex items-center gap-2 text-xs">
                Enabled
                <Switch checked={t.is_enabled} onCheckedChange={(v) => update(t.id, { is_enabled: v })} />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}