import { uploadGuestPhoto } from "@/hooks/use-media-upload";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Send, Check, Loader2, Image as ImageIcon, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Blessing {
  id: string;
  guest_name: string;
  message: string;
  photo_url: string | null;
  owner_reply: string | null;
  created_at: string;
}

interface BlessingWallProps {
  siteId: string;
  accent: string;
  heading?: string;
  description?: string;
  isPremium?: boolean;
  trackEvent?: (type: string, meta?: Record<string, any>) => void;
}

export default function BlessingWall({ siteId, accent, heading, description, isPremium, trackEvent }: BlessingWallProps) {
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [form, setForm] = useState({ guest_name: "", message: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase
      .from("guest_blessings" as any)
      .select("*")
      .eq("wedding_site_id", siteId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setBlessings(data as any);
      });
  }, [siteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guest_name.trim() || !form.message.trim()) return;

    // Free plan limit: 20 blessings
    if (!isPremium && blessings.length >= 20) {
      toast({ title: "Blessing limit reached", description: "The couple's free plan allows up to 20 guest messages.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    let photoUrl: string | null = null;

    // Upload photo if premium and file selected
    if (isPremium && photoFile) {
      try {
        photoUrl = await uploadGuestPhoto(photoFile, siteId);
      } catch {}
    }

    const { data: newBlessing, error } = await supabase
      .from("guest_blessings" as any)
      .insert({
        wedding_site_id: siteId,
        guest_name: form.guest_name.trim(),
        message: form.message.trim(),
        photo_url: photoUrl,
        status: "pending",
      } as any)
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to post blessing", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
      setForm({ guest_name: "", message: "" });
      setPhotoFile(null);
      toast({ title: "Blessing sent! 💕", description: "Your message will appear after the couple approves it." });
      trackEvent?.("blessing_post");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="bg-card py-16 md:py-20 px-6"
    >
      <div className="max-w-3xl mx-auto">
        <Heart className="w-6 h-6 mx-auto mb-3" style={{ color: accent }} fill="currentColor" />
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">
          {heading || "Guest Blessings"}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        <p className="text-muted-foreground font-body text-center mb-8 max-w-lg mx-auto">
          {description || "Share your heartfelt blessings and wishes for the couple!"}
        </p>

        {/* Submit form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-background border border-border/50 rounded-2xl p-6 mb-8 space-y-4 max-w-lg mx-auto">
            <Input
              placeholder="Your name"
              value={form.guest_name}
              onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
              required
              maxLength={100}
              className="font-body"
            />
            <Textarea
              placeholder="Write your blessing for the couple..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              maxLength={500}
              rows={3}
              className="font-body"
            />
            {isPremium && (
              <div>
                <label className="flex items-center gap-2 text-xs font-body text-muted-foreground cursor-pointer">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{photoFile ? photoFile.name : "Add a photo (optional)"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}
            <Button type="submit" variant="gold" className="w-full font-body" disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send Blessing</>}
            </Button>
          </form>
        ) : (
          <div className="bg-background border border-border/50 rounded-2xl p-6 mb-8 text-center max-w-lg mx-auto">
            <Check className="w-8 h-8 mx-auto mb-2" style={{ color: accent }} />
            <p className="font-body text-foreground font-medium">Thank you for your blessing! 💕</p>
            <p className="font-body text-xs text-muted-foreground mt-1">Your message will appear after the couple approves it.</p>
            <button onClick={() => setSubmitted(false)} className="text-sm hover:underline font-body mt-2" style={{ color: accent }}>
              Send another blessing
            </button>
          </div>
        )}

        {/* Blessings grid */}
        {blessings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {blessings.map((blessing) => (
              <motion.div
                key={blessing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background border border-border/50 rounded-xl p-4"
              >
                {blessing.photo_url && (
                  <img
                    src={blessing.photo_url}
                    alt={`Photo from ${blessing.guest_name}`}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                    loading="lazy"
                  />
                )}
                <p className="font-body text-sm text-foreground">{blessing.message}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-body text-xs font-medium" style={{ color: accent }}>— {blessing.guest_name}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {new Date(blessing.created_at).toLocaleDateString()}
                  </p>
                </div>
                {blessing.owner_reply && (
                  <div className="mt-3 pl-3 border-l-2" style={{ borderColor: `${accent}40` }}>
                    <p className="font-body text-xs text-muted-foreground italic">
                      💕 {blessing.owner_reply}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
