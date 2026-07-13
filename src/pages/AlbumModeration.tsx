import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, EyeOff, Trash2, Eye, Loader2, ImageIcon, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { GuestModerationTemplatesDialog } from "@/components/GuestModerationTemplatesDialog";

type Status = "pending" | "approved" | "hidden";

interface Post {
  id: string;
  wedding_site_id: string;
  guest_name: string;
  caption: string | null;
  photo_url: string;
  status: Status;
  created_at: string;
}

const STATUSES: Status[] = ["pending", "approved", "hidden"];

const AlbumModeration = () => {
  const { siteId = "" } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [siteLabel, setSiteLabel] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: site } = await supabase
        .from("wedding_sites")
        .select("id, user_id, partner1, partner2")
        .eq("id", siteId)
        .maybeSingle();

      if (!site || site.user_id !== user.id) {
        toast({ title: "Not found", description: "This album isn't yours to moderate.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      if (cancelled) return;
      setSiteLabel([site.partner1, site.partner2].filter(Boolean).join(" & ") || "Wedding album");

      const { data, error } = await supabase
        .from("guest_album_posts")
        .select("id, wedding_site_id, guest_name, caption, photo_url, status, created_at")
        .eq("wedding_site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;

      if (error) {
        toast({ title: "Couldn't load album", description: error.message, variant: "destructive" });
      } else {
        const list = (data || []) as Post[];
        setPosts(list);
        if (list.length > 0) {
          const { data: r } = await supabase
            .from("guest_album_reactions")
            .select("post_id")
            .in("post_id", list.map((p) => p.id));
          const counts: Record<string, number> = {};
          for (const row of (r as { post_id: string }[]) || []) {
            counts[row.post_id] = (counts[row.post_id] || 0) + 1;
          }
          setReactionCounts(counts);
        }
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [siteId, user, authLoading, navigate]);

  const byStatus = useMemo(() => {
    const map: Record<Status, Post[]> = { pending: [], approved: [], hidden: [] };
    for (const p of posts) map[p.status]?.push(p);
    return map;
  }, [posts]);

  const updateStatus = async (post: Post, next: Status) => {
    setBusyId(post.id);
    const prevStatus = post.status;
    setPosts((cur) => cur.map((p) => (p.id === post.id ? { ...p, status: next } : p)));
    const { error } = await supabase
      .from("guest_album_posts")
      .update({ status: next })
      .eq("id", post.id);
    setBusyId(null);
    if (error) {
      setPosts((cur) => cur.map((p) => (p.id === post.id ? { ...p, status: prevStatus } : p)));
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    // Fire-and-forget notify (only if guest provided an email)
    if (next === "approved" || next === "hidden") {
      supabase.functions.invoke("guest-moderation-notify", {
        body: { post_id: post.id, action: next },
      }).catch(() => {});
    }
    toast({
      title:
        next === "approved" ? "Photo approved ✨" :
        next === "hidden" ? "Photo hidden from guests" :
        "Photo returned to pending",
    });
  };

  const removePost = async (post: Post) => {
    if (!confirm(`Permanently delete ${post.guest_name}'s photo? This also removes all reactions and cannot be undone.`)) return;
    setBusyId(post.id);
    // Notify BEFORE delete so we can still read guest_email server-side.
    try {
      await supabase.functions.invoke("guest-moderation-notify", {
        body: { post_id: post.id, action: "deleted" },
      });
    } catch { /* non-blocking */ }
    // Reactions cascade via FK on post delete.
    const { error } = await supabase.from("guest_album_posts").delete().eq("id", post.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((cur) => cur.filter((p) => p.id !== post.id));
    setReactionCounts((cur) => { const n = { ...cur }; delete n[post.id]; return n; });
    toast({ title: "Photo deleted" });
  };

  const clearReactions = async (post: Post) => {
    if (!confirm(`Clear all reactions on ${post.guest_name}'s photo?`)) return;
    setBusyId(post.id);
    const { error } = await supabase
      .from("guest_album_reactions")
      .delete()
      .eq("post_id", post.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Couldn't clear reactions", description: error.message, variant: "destructive" });
      return;
    }
    setReactionCounts((cur) => ({ ...cur, [post.id]: 0 }));
    toast({ title: "Reactions cleared" });
  };

  const renderCard = (post: Post) => {
    const busy = busyId === post.id;
    const rc = reactionCounts[post.id] || 0;
    return (
      <Card key={post.id} className="overflow-hidden">
        <div className="aspect-square bg-muted relative">
          <img
            src={post.photo_url}
            alt={post.caption || `Photo by ${post.guest_name}`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 backdrop-blur bg-background/80"
          >
            {post.status}
          </Badge>
          {rc > 0 && (
            <Badge className="absolute top-2 right-2 bg-background/80 text-foreground backdrop-blur">
              <Heart className="w-3 h-3 mr-1" /> {rc}
            </Badge>
          )}
        </div>
        <div className="p-3 space-y-2">
          <div>
            <p className="font-display text-sm font-semibold text-foreground truncate">{post.guest_name}</p>
            {post.caption && (
              <p className="text-xs text-muted-foreground font-body line-clamp-2 mt-0.5">{post.caption}</p>
            )}
            <p className="text-[11px] text-muted-foreground font-body mt-1">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.status !== "approved" && (
              <Button size="sm" variant="gold" onClick={() => updateStatus(post, "approved")} disabled={busy}>
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" /> Approve</>}
              </Button>
            )}
            {post.status !== "hidden" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(post, "hidden")} disabled={busy}>
                <EyeOff className="w-3.5 h-3.5 mr-1" /> Hide
              </Button>
            )}
            {post.status === "hidden" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(post, "pending")} disabled={busy}>
                <Eye className="w-3.5 h-3.5 mr-1" /> Re-review
              </Button>
            )}
            {rc > 0 && (
              <Button size="sm" variant="ghost" onClick={() => clearReactions(post)} disabled={busy}>
                Clear reactions
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removePost(post)} disabled={busy}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Link>
          </Button>
          <div className="ml-auto">
            {siteId && <GuestModerationTemplatesDialog siteId={siteId} />}
          </div>
        </div>

        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Guest album moderation</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {siteLabel ? `${siteLabel} — ` : ""}Approve photos before they appear to guests, hide anything off-tone, or delete permanently.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-display text-lg font-semibold text-foreground">No album photos yet</p>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Once guests upload, they'll show up here for you to approve.
            </p>
          </Card>
        ) : (
          <Tabs defaultValue={byStatus.pending.length > 0 ? "pending" : "approved"}>
            <TabsList>
              {STATUSES.map((s) => (
                <TabsTrigger key={s} value={s}>
                  <span className="capitalize">{s}</span>
                  <Badge variant="secondary" className="ml-2">{byStatus[s].length}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {STATUSES.map((s) => (
              <TabsContent key={s} value={s} className="mt-6">
                {byStatus[s].length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body text-center py-12">
                    Nothing in <span className="capitalize">{s}</span>.
                  </p>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {byStatus[s].map(renderCard)}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AlbumModeration;