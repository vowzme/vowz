import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { VENDOR_CATEGORIES, type VendorRow, type VendorService } from "@/lib/vendor-categories";
import { Loader2, Plus, Trash2, ExternalLink, ImagePlus, Save } from "lucide-react";

const STATUS_COPY: Record<string, { label: string; tone: string; note: string }> = {
  pending: { label: "Awaiting review", tone: "bg-amber-500/15 text-amber-600 border-amber-500/30", note: "Your page is hidden until our team approves it. Usually within a day." },
  approved: { label: "Live", tone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", note: "Your page is listed in the vendor directory." },
  rejected: { label: "Needs changes", tone: "bg-destructive/15 text-destructive border-destructive/30", note: "We couldn’t approve this page yet. Update the details and save to request another review." },
  suspended: { label: "Suspended", tone: "bg-destructive/15 text-destructive border-destructive/30", note: "This page is not visible. Contact support for help." },
};

export default function VendorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { upload } = useMediaUpload();
  const [vendor, setVendor] = useState<VendorRow | null>(null);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent("/vendor/dashboard")}`, { replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase.from("vendors" as any).select("*").eq("user_id", user.id).maybeSingle();
      if (!data) {
        navigate("/vendors/signup", { replace: true });
        return;
      }
      setVendor(data as any);
      const { data: enq } = await supabase
        .from("vendor_enquiries" as any)
        .select("*")
        .eq("vendor_id", (data as any).id)
        .order("created_at", { ascending: false })
        .limit(100);
      setEnquiries((enq as any) || []);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const patch = (p: Partial<VendorRow>) => setVendor((v) => (v ? { ...v, ...p } : v));

  const save = async () => {
    if (!vendor) return;
    setSaving(true);
    const { error } = await supabase
      .from("vendors" as any)
      .update({
        business_name: vendor.business_name?.slice(0, 120),
        category: vendor.category,
        tagline: vendor.tagline?.slice(0, 160) || null,
        about: vendor.about?.slice(0, 4000) || null,
        city: vendor.city || null,
        state: vendor.state || null,
        service_areas: vendor.service_areas || [],
        phone: vendor.phone || null,
        whatsapp: vendor.whatsapp || null,
        email: vendor.email || null,
        website: vendor.website || null,
        instagram: vendor.instagram || null,
        logo_url: vendor.logo_url || null,
        cover_url: vendor.cover_url || null,
        gallery: (vendor.gallery || []) as any,
        services: (vendor.services || []) as any,
        hours: vendor.hours || null,
        price_from: vendor.price_from ?? null,
        currency: vendor.currency || "INR",
        status: vendor.status === "rejected" ? "pending" : vendor.status,
      } as any)
      .eq("id", vendor.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    if (vendor.status === "rejected") patch({ status: "pending" });
    toast({ title: "Saved" });
  };

  const pickImage = async (file: File | undefined, target: "cover" | "logo" | "gallery") => {
    if (!file || !vendor) return;
    setUploading(target);
    try {
      const url = await upload(file, `vendor-${target}`);
      if (!url) throw new Error("Upload failed");
      if (target === "cover") patch({ cover_url: url });
      else if (target === "logo") patch({ logo_url: url });
      else patch({ gallery: [...(vendor.gallery || []), url].slice(0, 24) });
      toast({ title: "Image added", description: "Remember to save." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  if (authLoading || loading || !vendor) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>;
  }

  const status = STATUS_COPY[vendor.status] || STATUS_COPY.pending;
  const services = (vendor.services || []) as VendorService[];

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-semibold truncate">{vendor.business_name}</h1>
            <Badge variant="outline" className={`mt-1 ${status.tone}`}>{status.label}</Badge>
          </div>
          {vendor.status === "approved" && (
            <Button asChild variant="outline" className="h-10">
              <Link to={`/vendor/${vendor.slug}`} target="_blank"><ExternalLink className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">View page</span></Link>
            </Button>
          )}
          <Button onClick={save} disabled={saving} className="h-10 bg-gold text-background hover:bg-gold/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Save</span></>}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        <p className="font-body text-sm text-muted-foreground">{status.note}</p>

        <Tabs defaultValue="page">
          <TabsList className="h-12 w-full justify-start overflow-x-auto">
            <TabsTrigger value="page" className="h-10">Brand page</TabsTrigger>
            <TabsTrigger value="services" className="h-10">Services</TabsTrigger>
            <TabsTrigger value="photos" className="h-10">Photos</TabsTrigger>
            <TabsTrigger value="enquiries" className="h-10">Enquiries ({enquiries.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="page" className="mt-4">
            <Card><CardContent className="p-5 space-y-4">
              <Input className="h-11" value={vendor.business_name || ""} onChange={(e) => patch({ business_name: e.target.value })} placeholder="Business name" />
              <select
                value={vendor.category}
                onChange={(e) => patch({ category: e.target.value })}
                className="w-full h-11 rounded-md border border-border bg-background px-3 font-body text-sm"
              >
                {VENDOR_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
              <Input className="h-11" value={vendor.tagline || ""} onChange={(e) => patch({ tagline: e.target.value })} placeholder="Tagline" />
              <Textarea rows={6} value={vendor.about || ""} onChange={(e) => patch({ about: e.target.value })} placeholder="About your business" />
              <div className="grid sm:grid-cols-2 gap-3">
                <Input className="h-11" value={vendor.city || ""} onChange={(e) => patch({ city: e.target.value })} placeholder="City" />
                <Input className="h-11" value={vendor.state || ""} onChange={(e) => patch({ state: e.target.value })} placeholder="State" />
                <Input className="h-11" value={vendor.phone || ""} onChange={(e) => patch({ phone: e.target.value })} placeholder="Phone" />
                <Input className="h-11" value={vendor.whatsapp || ""} onChange={(e) => patch({ whatsapp: e.target.value })} placeholder="WhatsApp number" />
                <Input className="h-11" value={vendor.email || ""} onChange={(e) => patch({ email: e.target.value })} placeholder="Email" />
                <Input className="h-11" value={vendor.website || ""} onChange={(e) => patch({ website: e.target.value })} placeholder="Website" />
                <Input className="h-11" value={vendor.instagram || ""} onChange={(e) => patch({ instagram: e.target.value })} placeholder="Instagram link" />
                <Input className="h-11" value={vendor.hours || ""} onChange={(e) => patch({ hours: e.target.value })} placeholder="Working hours" />
                <Input className="h-11" type="number" value={vendor.price_from ?? ""} onChange={(e) => patch({ price_from: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Starting price" />
                <Input className="h-11" value={vendor.currency || "INR"} onChange={(e) => patch({ currency: e.target.value })} placeholder="Currency" />
              </div>
              <Input
                className="h-11"
                value={(vendor.service_areas || []).join(", ")}
                onChange={(e) => patch({ service_areas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20) })}
                placeholder="Service areas, comma separated"
              />
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="services" className="mt-4">
            <Card><CardContent className="p-5 space-y-3">
              {services.length === 0 && <p className="font-body text-sm text-muted-foreground">Add your packages so couples know what you offer.</p>}
              {services.map((s, i) => (
                <div key={i} className="grid sm:grid-cols-[1fr_140px_auto] gap-2 items-start border-b border-border/40 pb-3">
                  <div className="space-y-2">
                    <Input className="h-11" value={s.name} placeholder="Package name" onChange={(e) => {
                      const next = [...services]; next[i] = { ...s, name: e.target.value }; patch({ services: next });
                    }} />
                    <Textarea rows={2} value={s.description || ""} placeholder="What's included" onChange={(e) => {
                      const next = [...services]; next[i] = { ...s, description: e.target.value }; patch({ services: next });
                    }} />
                  </div>
                  <Input className="h-11" value={s.price || ""} placeholder="₹50,000" onChange={(e) => {
                    const next = [...services]; next[i] = { ...s, price: e.target.value }; patch({ services: next });
                  }} />
                  <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => patch({ services: services.filter((_, j) => j !== i) })}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="h-11" onClick={() => patch({ services: [...services, { name: "", price: "", description: "" }] })}>
                <Plus className="w-4 h-4 mr-1" /> Add package
              </Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <Card><CardContent className="p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-sm mb-2">Cover image</p>
                  <div className="h-32 rounded-lg border border-border bg-muted overflow-hidden mb-2">
                    {vendor.cover_url && <img src={vendor.cover_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0], "cover")} />
                  <Button variant="outline" className="h-11 w-full" onClick={() => coverRef.current?.click()} disabled={uploading === "cover"}>
                    {uploading === "cover" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ImagePlus className="w-4 h-4 mr-1" /> Upload cover</>}
                  </Button>
                </div>
                <div>
                  <p className="font-body text-sm mb-2">Logo</p>
                  <div className="h-32 w-32 rounded-lg border border-border bg-muted overflow-hidden mb-2">
                    {vendor.logo_url && <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0], "logo")} />
                  <Button variant="outline" className="h-11 w-full" onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}>
                    {uploading === "logo" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ImagePlus className="w-4 h-4 mr-1" /> Upload logo</>}
                  </Button>
                </div>
              </div>

              <div>
                <p className="font-body text-sm mb-2">Work gallery</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                  {(vendor.gallery || []).map((g, i) => (
                    <div key={i} className="relative">
                      <img src={g} alt="" className="w-full h-24 object-cover rounded-lg border border-border/50" />
                      <button
                        onClick={() => patch({ gallery: (vendor.gallery || []).filter((_, j) => j !== i) })}
                        className="absolute top-1 right-1 bg-background/90 rounded-full p-1.5"
                        aria-label="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
                <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0], "gallery")} />
                <Button variant="outline" className="h-11" onClick={() => galleryRef.current?.click()} disabled={uploading === "gallery"}>
                  {uploading === "gallery" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ImagePlus className="w-4 h-4 mr-1" /> Add photo</>}
                </Button>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="enquiries" className="mt-4">
            <Card><CardContent className="p-5 space-y-3">
              {enquiries.length === 0 && <p className="font-body text-sm text-muted-foreground">No enquiries yet.</p>}
              {enquiries.map((e) => (
                <div key={e.id} className="border-b border-border/40 pb-3 last:border-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-body font-medium">{e.name}</p>
                    <a href={`mailto:${e.email}`} className="font-body text-sm text-gold underline">{e.email}</a>
                    {e.phone && <a href={`tel:${e.phone}`} className="font-body text-sm text-muted-foreground">{e.phone}</a>}
                    {e.event_date && <span className="font-body text-xs text-muted-foreground">Event {e.event_date}</span>}
                  </div>
                  {e.message && <p className="font-body text-sm text-muted-foreground mt-1 whitespace-pre-line">{e.message}</p>}
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
