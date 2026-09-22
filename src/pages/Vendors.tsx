import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VENDOR_CATEGORIES, vendorCategoryLabel, type VendorRow } from "@/lib/vendor-categories";
import { MapPin, Star, Loader2, Store, Search } from "lucide-react";

export default function Vendors() {
  const { category } = useParams<{ category?: string }>();
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("vendors" as any)
        .select("*")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false })
        .limit(200);
      if (category) query = query.eq("category", category);
      const { data } = await query;
      setVendors(((data as any) || []) as VendorRow[]);
      setLoading(false);
    })();
  }, [category]);

  const cities = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.city).filter(Boolean) as string[])).sort(),
    [vendors],
  );

  const shown = useMemo(
    () =>
      vendors.filter((v) => {
        const hay = `${v.business_name} ${v.tagline || ""} ${v.city || ""} ${(v.service_areas || []).join(" ")}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (city && v.city !== city) return false;
        return true;
      }),
    [vendors, q, city],
  );

  const title = category
    ? `${vendorCategoryLabel(category)} for Weddings | Vowz Vendors`
    : "Wedding Vendors & Services Near You | Vowz";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description="Find trusted wedding photographers, decorators, caterers, makeup artists, venues and more. Browse by city, compare packages and enquire directly."
        canonical={category ? `/vendors/${category}` : "/vendors"}
      />
      <section className="px-4 pt-10 pb-6 max-w-6xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
          {category ? vendorCategoryLabel(category) : "Wedding vendors near you"}
        </h1>
        <p className="font-body text-muted-foreground mt-2 max-w-2xl">
          Browse verified wedding businesses, see their packages and message them directly.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant={category ? "outline" : "default"} className="h-10">
            <Link to="/vendors">All</Link>
          </Button>
          {VENDOR_CATEGORIES.map((c) => (
            <Button key={c.id} asChild size="sm" variant={category === c.id ? "default" : "outline"} className="h-10">
              <Link to={`/vendors/${c.id}`}>{c.emoji} {c.label}</Link>
            </Button>
          ))}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or area" className="h-11 pl-9" />
          </div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-11 rounded-md border border-border bg-background px-3 font-body text-sm"
          >
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button asChild variant="outline" className="h-11">
            <Link to="/vendors/signup"><Store className="w-4 h-4 mr-1" /> List your business</Link>
          </Button>
        </div>
      </section>

      <section className="px-4 pb-16 max-w-6xl mx-auto">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
        ) : shown.length === 0 ? (
          <Card><CardContent className="p-10 text-center font-body text-muted-foreground">
            No vendors listed here yet. If this is your trade, <Link to="/vendors/signup" className="text-gold underline">add your business</Link>.
          </CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((v) => (
              <Link key={v.id} to={`/vendor/${v.slug}`} className="group">
                <Card className="overflow-hidden h-full border-border/60 hover:border-gold/60 transition-colors">
                  <div className="h-36 bg-muted overflow-hidden">
                    {v.cover_url ? (
                      <img src={v.cover_url} alt={v.business_name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">{VENDOR_CATEGORIES.find((c) => c.id === v.category)?.emoji || "💍"}</div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <h2 className="font-display text-lg font-semibold flex-1 truncate">{v.business_name}</h2>
                      {v.is_featured && <Badge className="bg-gold text-background shrink-0">Featured</Badge>}
                    </div>
                    <p className="font-body text-sm text-muted-foreground line-clamp-2 mt-1">{v.tagline || vendorCategoryLabel(v.category)}</p>
                    <div className="flex items-center gap-3 mt-3 font-body text-xs text-muted-foreground">
                      {v.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{v.city}</span>}
                      {(v.review_count || 0) > 0 && (
                        <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-gold" />{Number(v.rating || 0).toFixed(1)} ({v.review_count})</span>
                      )}
                      {v.price_from != null && <span>from {v.currency || "INR"} {Number(v.price_from).toLocaleString()}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
