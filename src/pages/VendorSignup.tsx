import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { VENDOR_CATEGORIES, vendorSlugify } from "@/lib/vendor-categories";
import { Loader2, Store } from "lucide-react";

export default function VendorSignup() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    category: VENDOR_CATEGORIES[0].id,
    tagline: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    about: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    (async () => {
      const { data } = await supabase.from("vendors" as any).select("id").eq("user_id", user.id).maybeSingle();
      if (data) navigate("/vendor/dashboard", { replace: true });
      else setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent("/vendors/signup")}`);
      return;
    }
    if (!form.business_name.trim()) {
      toast({ title: "Add your business name", variant: "destructive" });
      return;
    }
    setSaving(true);
    const base = vendorSlugify(form.business_name) || "vendor";
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("vendors" as any).insert({
      user_id: user.id,
      slug,
      business_name: form.business_name.trim().slice(0, 120),
      category: form.category,
      tagline: form.tagline.trim().slice(0, 160) || null,
      city: form.city.trim().slice(0, 80) || null,
      state: form.state.trim().slice(0, 80) || null,
      phone: form.phone.trim().slice(0, 30) || null,
      whatsapp: form.whatsapp.trim().slice(0, 30) || null,
      about: form.about.trim().slice(0, 4000) || null,
      status: "pending",
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Could not create your page", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Business page created", description: "Finish your page — it goes live once we approve it." });
    navigate("/vendor/dashboard");
  };

  if (authLoading || checking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <SEOHead
        title="List Your Wedding Business Free | Vowz Vendors"
        description="Photographers, decorators, caterers, makeup artists and venues: create a free brand page, list your packages and get enquiries from couples planning their wedding."
        canonical="/vendors/signup"
      />
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-7">
          <Store className="w-8 h-8 text-gold mx-auto mb-2" />
          <h1 className="font-display text-3xl font-semibold">List your wedding business</h1>
          <p className="font-body text-muted-foreground mt-2">
            Get your own page with packages, photos and a WhatsApp button. Free to list — we review every page before it goes live.
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            {!user && (
              <p className="font-body text-sm text-muted-foreground mb-4">
                You’ll be asked to <Link to="/auth" className="text-gold underline">sign in</Link> when you submit.
              </p>
            )}
            <form onSubmit={submit} className="space-y-4">
              <Input className="h-11" placeholder="Business name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-11 rounded-md border border-border bg-background px-3 font-body text-sm"
              >
                {VENDOR_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
              <Input className="h-11" placeholder="One-line tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              <div className="grid sm:grid-cols-2 gap-3">
                <Input className="h-11" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <Input className="h-11" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                <Input className="h-11" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input className="h-11" placeholder="WhatsApp number" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
              <Textarea rows={5} placeholder="Tell couples about your work" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
              <Button type="submit" disabled={saving} className="w-full h-11 bg-gold text-background hover:bg-gold/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create my business page"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
