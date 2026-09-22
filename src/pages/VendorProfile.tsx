import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { vendorCategoryLabel, type VendorRow, type VendorService } from "@/lib/vendor-categories";
import { MapPin, Star, Globe, Instagram, Phone, MessageCircle, Loader2, Clock } from "lucide-react";

export default function VendorProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<VendorRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", event_date: "", message: "" });

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.from("vendors" as any).select("*").eq("slug", slug).eq("status", "approved").maybeSingle();
      setVendor((data as any) || null);
      setLoading(false);
    })();
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Add your name and email", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("vendor_enquiries" as any).insert({
      vendor_id: vendor.id,
      name: form.name.trim().slice(0, 100),
      email: form.email.trim().slice(0, 254),
      phone: form.phone.trim().slice(0, 30) || null,
      event_date: form.event_date || null,
      message: form.message.trim().slice(0, 1000) || null,
    } as any);
    setSending(false);
    if (error) {
      toast({ title: "Could not send", description: error.message, variant: "destructive" });
      return;
    }
    setForm({ name: "", email: "", phone: "", event_date: "", message: "" });
    toast({ title: "Enquiry sent", description: `${vendor.business_name} will get back to you.` });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>;

  if (!vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-2xl">This vendor page isn’t available.</p>
        <Button asChild variant="outline"><Link to="/vendors">Browse all vendors</Link></Button>
      </div>
    );
  }

  const services = (vendor.services || []) as VendorService[];
  const gallery = (vendor.gallery || []) as string[];
  const waNumber = (vendor.whatsapp || "").replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-background pb-16">
      <SEOHead
        title={`${vendor.business_name} — ${vendorCategoryLabel(vendor.category)}${vendor.city ? ` in ${vendor.city}` : ""} | Vowz`}
        description={vendor.tagline || `${vendor.business_name} offers ${vendorCategoryLabel(vendor.category).toLowerCase()} for weddings${vendor.city ? ` in ${vendor.city}` : ""}. See packages, photos and contact details.`}
        canonical={`/vendor/${vendor.slug}`}
        ogImage={vendor.cover_url || undefined}
      />

      <div className="h-48 sm:h-72 bg-muted overflow-hidden">
        {vendor.cover_url && <img src={vendor.cover_url} alt={vendor.business_name} className="w-full h-full object-cover" />}
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12 relative">
        <Card className="border-gold/30">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
            {vendor.logo_url && (
              <img src={vendor.logo_url} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold">{vendor.business_name}</h1>
                {vendor.is_featured && <Badge className="bg-gold text-background">Featured</Badge>}
              </div>
              <p className="font-body text-muted-foreground mt-1">{vendor.tagline || vendorCategoryLabel(vendor.category)}</p>
              <div className="flex flex-wrap gap-3 mt-2 font-body text-sm text-muted-foreground">
                {vendor.city && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{[vendor.city, vendor.state].filter(Boolean).join(", ")}</span>}
                {(vendor.review_count || 0) > 0 && <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 text-gold" />{Number(vendor.rating || 0).toFixed(1)} ({vendor.review_count})</span>}
                {vendor.hours && <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" />{vendor.hours}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {waNumber && (
                <Button asChild className="h-11 bg-gold text-background hover:bg-gold/90">
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</a>
                </Button>
              )}
              {vendor.phone && (
                <Button asChild variant="outline" className="h-11"><a href={`tel:${vendor.phone}`}><Phone className="w-4 h-4" /></a></Button>
              )}
              {vendor.website && (
                <Button asChild variant="outline" className="h-11"><a href={vendor.website} target="_blank" rel="noreferrer"><Globe className="w-4 h-4" /></a></Button>
              )}
              {vendor.instagram && (
                <Button asChild variant="outline" className="h-11"><a href={vendor.instagram} target="_blank" rel="noreferrer"><Instagram className="w-4 h-4" /></a></Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1fr_340px] gap-5 mt-6">
          <div className="space-y-5">
            {vendor.about && (
              <Card><CardContent className="p-5">
                <h2 className="font-display text-xl font-semibold mb-2">About</h2>
                <p className="font-body text-muted-foreground whitespace-pre-line">{vendor.about}</p>
              </CardContent></Card>
            )}

            {services.length > 0 && (
              <Card><CardContent className="p-5">
                <h2 className="font-display text-xl font-semibold mb-3">Packages & services</h2>
                <div className="space-y-3">
                  {services.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="font-body font-medium">{s.name}</p>
                        {s.description && <p className="font-body text-sm text-muted-foreground">{s.description}</p>}
                      </div>
                      {s.price && <span className="font-body text-sm text-gold whitespace-nowrap">{s.price}</span>}
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            )}

            {gallery.length > 0 && (
              <Card><CardContent className="p-5">
                <h2 className="font-display text-xl font-semibold mb-3">Work gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {gallery.map((g, i) => (
                    <img key={i} src={g} alt="" loading="lazy" decoding="async" className="w-full h-32 sm:h-40 object-cover rounded-lg border border-border/50" />
                  ))}
                </div>
              </CardContent></Card>
            )}

            {(vendor.service_areas || []).length > 0 && (
              <Card><CardContent className="p-5">
                <h2 className="font-display text-xl font-semibold mb-2">Service areas</h2>
                <div className="flex flex-wrap gap-2">
                  {(vendor.service_areas || []).map((a) => (
                    <span key={a} className="px-3 py-1.5 rounded-full bg-muted font-body text-sm">{a}</span>
                  ))}
                </div>
              </CardContent></Card>
            )}
          </div>

          <Card className="lg:sticky lg:top-6 self-start">
            <CardContent className="p-5">
              <h2 className="font-display text-xl font-semibold mb-1">Ask for availability</h2>
              <p className="font-body text-sm text-muted-foreground mb-4">Send your date and they’ll reply directly.</p>
              <form onSubmit={submit} className="space-y-3">
                <Input className="h-11" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input className="h-11" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input className="h-11" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input className="h-11" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                <Textarea rows={4} placeholder="Tell them about your wedding" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                <Button type="submit" disabled={sending} className="w-full h-11 bg-gold text-background hover:bg-gold/90">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send enquiry"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
