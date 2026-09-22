import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Camera } from "lucide-react";

interface WallPost {
  id: string;
  guest_name: string;
  caption: string | null;
  photo_url: string;
  created_at: string;
}

export default function PhotoWall() {
  const { slug } = useParams<{ slug: string }>();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [couple, setCouple] = useState("");
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const uploadUrl = useMemo(
    () => (typeof window === "undefined" ? "" : `${window.location.origin}/site/${slug}#album`),
    [slug],
  );

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("wedding_sites")
        .select("id, partner1, partner2")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) {
        setMissing(true);
        setLoading(false);
        return;
      }
      setSiteId(data.id);
      setCouple(`${data.partner1} & ${data.partner2}`);
    })();
  }, [slug]);

  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("guest_album_posts" as any)
        .select("id, guest_name, caption, photo_url, created_at")
        .eq("wedding_site_id", siteId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(60);
      if (!cancelled) {
        setPosts(((data as any) || []) as WallPost[]);
        setLoading(false);
      }
    };
    void load();
    // Live updates, with a slow poll as a safety net if realtime drops.
    const channel = supabase
      .channel(`photo-wall-${siteId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_album_posts", filter: `wedding_site_id=eq.${siteId}` }, () => void load())
      .subscribe();
    const poll = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [siteId]);

  useEffect(() => {
    document.title = couple ? `${couple} — Live photo wall` : "Live photo wall";
  }, [couple]);

  if (missing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy text-ivory font-body">
        That wedding page could not be found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-ivory overflow-hidden">
      <header className="flex items-center gap-4 px-5 sm:px-10 py-4 border-b border-gold/20">
        <div className="flex-1 min-w-0">
          <p className="font-display text-xl sm:text-3xl text-gold truncate">{couple || "Live photo wall"}</p>
          <p className="font-body text-xs sm:text-sm text-ivory/70">
            Scan the code to add your photos — they appear here once approved.
          </p>
        </div>
        <div className="bg-ivory p-2 rounded-lg shrink-0">
          <QRCodeSVG value={uploadUrl} size={84} bgColor="#F5F5DC" fgColor="#001F3F" />
        </div>
      </header>

      {loading ? (
        <div className="h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
      ) : posts.length === 0 ? (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-center px-6">
          <Camera className="w-10 h-10 text-gold" />
          <p className="font-display text-2xl">No photos yet</p>
          <p className="font-body text-ivory/70 max-w-md">Scan the code above and be the first to share a moment.</p>
        </div>
      ) : (
        <div className="p-3 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <AnimatePresence initial={false}>
            {posts.map((p) => (
              <motion.figure
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-xl overflow-hidden border border-gold/25 bg-black/20"
              >
                <img
                  src={p.photo_url}
                  alt={p.caption || `Photo by ${p.guest_name}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-40 sm:h-56 object-cover"
                />
                <figcaption className="px-3 py-2">
                  {p.caption && <p className="font-body text-sm text-ivory/90 line-clamp-2">{p.caption}</p>}
                  <p className="font-body text-xs text-gold/80">{p.guest_name}</p>
                </figcaption>
              </motion.figure>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
