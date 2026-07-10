import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Palette } from "lucide-react";

interface Branding {
  logo_url: string;
  primary_color: string;
  accent_color: string;
  button_text_color: string;
  from_name: string;
  footer_text: string;
}

const DEFAULTS: Branding = {
  logo_url: "https://qkjuywqrncsbxjzwtlzm.supabase.co/storage/v1/object/public/email-assets/vowz-logo.png",
  primary_color: "#001F3F",
  accent_color: "#B8943E",
  button_text_color: "#F5F0E8",
  from_name: "vowz",
  footer_text: "Sent with love via VowZ · beautiful wedding websites.",
};

export default function AdminEmailBranding() {
  const [b, setB] = useState<Branding>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("email_branding").select("*").eq("id", 1).maybeSingle();
      if (!error && data) setB({ ...DEFAULTS, ...(data as any) });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("email_branding").upsert({ id: 1, ...b } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Branding saved", description: "All new emails will use these settings." });
  };

  const reset = () => setB(DEFAULTS);

  const set = <K extends keyof Branding>(k: K, v: Branding[K]) => setB((p) => ({ ...p, [k]: v }));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Palette className="w-6 h-6 text-[hsl(var(--gold))]" />
        <div>
          <h1 className="font-display text-2xl">Email Branding</h1>
          <p className="text-sm text-muted-foreground">Customize logo, colors, and From name for all transactional emails.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Applies to all vowz.me transactional emails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from_name">From name</Label>
              <Input id="from_name" value={b.from_name} onChange={(e) => set("from_name", e.target.value)} />
              <p className="text-xs text-muted-foreground">Shown as sender in inbox (e.g. "{b.from_name} &lt;noreply@vowz.me&gt;").</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" value={b.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://…" />
              <p className="text-xs text-muted-foreground">Public URL. Renders at 120×40. Upload via Storage → email-assets.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ColorField label="Primary" value={b.primary_color} onChange={(v) => set("primary_color", v)} />
              <ColorField label="Accent" value={b.accent_color} onChange={(v) => set("accent_color", v)} />
              <ColorField label="Button text" value={b.button_text_color} onChange={(v) => set("button_text_color", v)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer_text">Footer text</Label>
              <Input id="footer_text" value={b.footer_text} onChange={(e) => set("footer_text", e.target.value)} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save branding
              </Button>
              <Button variant="outline" onClick={reset} disabled={saving}>Reset to defaults</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>Approximates how templates render.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-white p-6 text-sm" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>
              <img src={b.logo_url} alt={b.from_name} style={{ height: 40, marginBottom: 20 }} onError={(e) => ((e.currentTarget.style.display = "none"))} />
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: b.primary_color, fontSize: 22, margin: "0 0 12px" }}>
                Sample subject line
              </h2>
              <p style={{ color: "#4A6A8A", margin: "0 0 12px" }}>Hi there,</p>
              <p style={{ color: "#4A6A8A", margin: "0 0 20px" }}>
                This is how your branded emails will look to your recipients.
              </p>
              <div style={{ textAlign: "center", margin: "20px 0" }}>
                <span style={{ display: "inline-block", background: b.primary_color, color: b.button_text_color, padding: "12px 24px", borderRadius: 12 }}>
                  Call to action
                </span>
              </div>
              <div style={{ background: "#FAF7F0", border: "1px solid #E8E0D4", borderRadius: 12, padding: "12px 16px", margin: "16px 0" }}>
                <div style={{ color: b.accent_color, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Label</div>
                <div style={{ color: b.primary_color }}>Value</div>
              </div>
              <hr style={{ borderColor: "#E8E0D4", margin: "20px 0 12px" }} />
              <p style={{ color: "#999", fontSize: 12, textAlign: "center", margin: 0 }}>{b.footer_text}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 rounded border cursor-pointer bg-transparent"
          aria-label={`${label} color picker`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}