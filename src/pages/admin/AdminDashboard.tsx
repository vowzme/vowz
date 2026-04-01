import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, Heart, Lightbulb, Ticket, FileText, BarChart3, Crown, Network } from "lucide-react";
import { AdminUsageWidget } from "@/components/admin/AdminUsageWidget";
import { AdminCloudHealthWidget } from "@/components/admin/AdminCloudHealthWidget";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, sites: 0, publishedSites: 0, rsvps: 0, featureRequests: 0, coupons: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, sitesRes, rsvpsRes, featuresRes, couponsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("wedding_sites").select("id, is_published", { count: "exact" }),
        supabase.from("rsvps").select("id", { count: "exact", head: true }),
        supabase.from("feature_requests" as any).select("id", { count: "exact", head: true }),
        supabase.from("coupons").select("id", { count: "exact", head: true }),
      ]);

      const publishedCount = sitesRes.data?.filter((s: any) => s.is_published).length ?? 0;

      setStats({
        users: profilesRes.count ?? 0,
        sites: sitesRes.count ?? sitesRes.data?.length ?? 0,
        publishedSites: publishedCount,
        rsvps: rsvpsRes.count ?? 0,
        featureRequests: (featuresRes as any).count ?? 0,
        coupons: (couponsRes as any).count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-[hsl(var(--navy))]", route: "/admin/users" },
    { label: "Wedding Sites", value: stats.sites, icon: Globe, color: "text-[hsl(var(--gold))]", route: "/admin/sites" },
    { label: "Published Sites", value: stats.publishedSites, icon: Globe, color: "text-emerald-500", route: "/admin/sites" },
    { label: "Total RSVPs", value: stats.rsvps, icon: Heart, color: "text-rose-500", route: "/admin/sites" },
    { label: "Feature Requests", value: stats.featureRequests, icon: Lightbulb, color: "text-amber-500", route: "/admin/feature-requests" },
    { label: "Coupons", value: stats.coupons, icon: Ticket, color: "text-purple-500", route: "/admin/coupons" },
    { label: "Analytics", value: "→", icon: BarChart3, color: "text-sky-500", route: "/admin/analytics" },
    { label: "Franchise Partners", value: "→", icon: Network, color: "text-indigo-500", route: "/admin/franchise" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <Card
            key={c.label}
            className="border-border/50 cursor-pointer hover:border-[hsl(var(--gold))]/50 hover:shadow-md transition-all duration-200 group"
            onClick={() => navigate(c.route)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-body font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {c.label}
              </CardTitle>
              <c.icon className={`h-5 w-5 ${c.color} group-hover:scale-110 transition-transform`} />
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loading ? "—" : c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cloud Health & Storage */}
      <AdminCloudHealthWidget />

      {/* Usage & Credits Monitor */}
      <AdminUsageWidget />
    </div>
  );
}
