import { uploadGuestPhoto } from "@/hooks/use-media-upload";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, Send, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ReactionKey = "heart" | "party" | "love" | "clap" | "cheers";
const REACTIONS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: "heart", emoji: "❤️", label: "Love" },
  { key: "party", emoji: "🎉", label: "Celebrate" },
  { key: "love", emoji: "😍", label: "Adore" },
  { key: "clap", emoji: "👏", label: "Applause" },
  { key: "cheers", emoji: "🥂", label: "Cheers" },
];

interface AlbumPost {
  id: string;
  guest_name: string;
  caption: string | null;
  photo_url: string;
  created_at: string;
}

interface Props {
  siteId: string;
  accent: string;
  heading?: string;
  description?: string;
  trackEvent?: (type: string, meta?: Record<string, any>) => void;
}

// Anonymous but stable per-browser guest identifier so we can toggle reactions.
function getGuestId(): string {
  const KEY = "vowz_guest_id";
  let id = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
  if (!id) {
    id = (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
    try { localStorage.setItem(KEY, id); } catch {}
  }
  return id;
}

export default function GuestAlbum({ siteId, accent, heading, description, trackEvent }: Props) {
  const [posts, setPosts] = useState<AlbumPost[]>([]);
  const [counts, setCounts] = useState<Record<string, Record<ReactionKey, number>>>({});
  const [mine, setMine] = useState<Record<string, Set<ReactionKey>>>({});
  const [form, setForm] = useState({ guest_name: "", guest_email: "", caption: "" });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const guestId = getGuestId();

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("guest_album_posts" as any)
        .select("id, guest_name, caption, photo_url, created_at")
        .eq("wedding_site_id", siteId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(200);
      const list = (p as any as AlbumPost[]) || [];
      setPosts(list);
      if (list.length === 0) return;
      const ids = list.map((x) => x.id);
      // Reaction rows never expose who reacted; own reactions come from a scoped lookup.
      const { data: r } = await supabase
        .from("guest_album_reactions" as any)
        .select("post_id, reaction")
        .in("post_id", ids);
      const c: Record<string, Record<ReactionKey, number>> = {};
      for (const row of (r as any[]) || []) {
        c[row.post_id] ||= { heart: 0, party: 0, love: 0, clap: 0, cheers: 0 };
        c[row.post_id][row.reaction as ReactionKey]++;
      }
      const { data: own } = await supabase.rpc("my_album_reactions", {
        _site_id: siteId,
        _guest_identifier: guestId,
      } as any);
      const m: Record<string, Set<ReactionKey>> = {};
      for (const row of ((own as any[]) || [])) {
        m[row.post_id] ||= new Set();
        m[row.post_id].add(row.reaction as ReactionKey);
      }
      setCounts(c);
      setMine(m);
    })();
  }, [siteId, guestId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !form.guest_name.trim()) {
      toast({ title: "Add your name and a photo", variant: "destructive" });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "Photo too large", description: "Max 25 MB per photo.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const photoUrl = await uploadGuestPhoto(file, siteId);
      const { error } = await supabase
        .from("guest_album_posts" as any)
        .insert({
          wedding_site_id: siteId,
          guest_name: form.guest_name.trim().slice(0, 100),
          guest_email: form.guest_email.trim().slice(0, 254) || null,
          caption: form.caption.trim().slice(0, 500) || null,
          photo_url: photoUrl,
          status: "pending",
        } as any);
      if (error) throw error;
      // Post is pending moderation; don't show it in the feed yet.
      setForm({ guest_name: form.guest_name, guest_email: form.guest_email, caption: "" });
      setFile(null);
      toast({ title: "Photo submitted for review 📸", description: "The couple will approve it before it appears in the album." });
      trackEvent?.("album_post");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReaction = async (postId: string, reaction: ReactionKey) => {
    const active = mine[postId]?.has(reaction);
    // optimistic
    setMine((prev) => {
      const next = { ...prev };
      const set = new Set(next[postId] || []);
      if (active) set.delete(reaction); else set.add(reaction);
      next[postId] = set;
      return next;
    });
    setCounts((prev) => {
      const next = { ...prev };
      next[postId] ||= { heart: 0, party: 0, love: 0, clap: 0, cheers: 0 };
      next[postId] = { ...next[postId], [reaction]: Math.max(0, next[postId][reaction] + (active ? -1 : 1)) };
      return next;
    });
    if (active) {
      await supabase
        .from("guest_album_reactions" as any)
        .delete()
        .eq("post_id", postId)
        .eq("guest_identifier", guestId)
        .eq("reaction", reaction);
    } else {
      const { error } = await supabase
        .from("guest_album_reactions" as any)
        .insert({ post_id: postId, guest_identifier: guestId, reaction } as any);
      if (error && !/duplicate/i.test(error.message)) {
        toast({ title: "Couldn't react", description: error.message, variant: "destructive" });
      } else {
        trackEvent?.("album_react", { reaction });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-20 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <Camera className="w-6 h-6 mx-auto mb-3" style={{ color: accent }} />
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
          {heading || "Guest Album"}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <p className="text-muted-foreground font-body text-center mb-8 max-w-lg mx-auto">
          {description || "Share your favourite photos from the celebration. Every guest can post and react."}
        </p>

        <form
          onSubmit={handleUpload}
          className="bg-card border border-border/50 rounded-2xl p-6 mb-10 space-y-3 max-w-xl mx-auto"
        >
          <Input
            placeholder="Your name"
            value={form.guest_name}
            onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            required
            maxLength={100}
            className="font-body"
          />
          <Input
            type="email"
            placeholder="Your email (optional — we'll let you know when the couple approves your photo)"
            value={form.guest_email}
            onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
            maxLength={254}
            className="font-body"
          />
          <Textarea
            placeholder="Caption (optional)"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
            maxLength={500}
            rows={2}
            className="font-body"
          />
          <label className="flex items-center gap-2 text-sm font-body text-muted-foreground cursor-pointer border border-dashed border-border/60 rounded-lg px-3 py-2 hover:bg-muted/40">
            <ImageIcon className="w-4 h-4" />
            <span className="truncate">{file ? file.name : "Choose a photo (max 10 MB)"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <Button type="submit" variant="gold" className="w-full font-body" disabled={submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</> : <><Send className="w-4 h-4 mr-2" /> Post to album</>}
          </Button>
        </form>

        {posts.length === 0 ? (
          <p className="text-center font-body text-sm text-muted-foreground">Be the first to share a photo.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 rounded-xl overflow-hidden"
              >
                <img
                  src={post.photo_url}
                  alt={`Photo from ${post.guest_name}`}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
                <div className="p-3 space-y-2">
                  {post.caption && <p className="font-body text-sm text-foreground">{post.caption}</p>}
                  <div className="flex items-center justify-between">
                    <p className="font-body text-xs font-medium" style={{ color: accent }}>— {post.guest_name}</p>
                    <p className="font-body text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {REACTIONS.map(({ key, emoji, label }) => {
                      const active = mine[post.id]?.has(key);
                      const n = counts[post.id]?.[key] || 0;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleReaction(post.id, key)}
                          aria-label={label}
                          aria-pressed={!!active}
                          className={`px-2 py-1 rounded-full text-xs font-body border transition-colors ${
                            active ? "border-gold bg-gold/10 text-foreground font-medium" : "border-border/50 text-muted-foreground hover:border-border"
                          }`}
                        >
                          <span className="mr-1">{emoji}</span>{n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}