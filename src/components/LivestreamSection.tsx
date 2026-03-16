import { motion } from "framer-motion";
import { Video, ExternalLink } from "lucide-react";

function getLivestreamEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube Live
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Google Meet - can't embed, show link
  // Zoom - can't embed, show link
  return null;
}

interface LivestreamSectionProps {
  data: {
    heading?: string;
    description?: string;
    embedUrl?: string;
  };
  accent: string;
  isPremium?: boolean;
}

export function LivestreamPublicSection({ data, accent, isPremium }: LivestreamSectionProps) {
  if (!data.embedUrl) return null;

  const embedSrc = getLivestreamEmbedUrl(data.embedUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-20 px-6"
    >
      <div className="max-w-3xl mx-auto text-center">
        <Video className="w-6 h-6 mx-auto mb-3" style={{ color: accent }} />
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          {data.heading || "Live Stream"}
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-4" style={{ backgroundColor: accent }} />
        {data.description && (
          <p className="text-muted-foreground font-body text-center mb-8 max-w-lg mx-auto">
            {data.description}
          </p>
        )}

        {embedSrc ? (
          <div className={`aspect-video rounded-2xl overflow-hidden shadow-elegant ${isPremium ? "border-2" : "border border-border/50"}`} style={isPremium ? { borderColor: `${accent}40` } : {}}>
            <iframe
              src={embedSrc}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={data.heading || "Live Stream"}
              loading="lazy"
            />
          </div>
        ) : (
          <a
            href={data.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-body font-medium text-sm transition-all hover:scale-105"
            style={{ backgroundColor: accent, color: "#fff" }}
          >
            <Video className="w-4 h-4" /> Join Live Stream
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {!embedSrc && data.embedUrl && (
          <p className="text-xs text-muted-foreground font-body mt-4">
            This link will open in a new tab (Zoom, Google Meet, etc.)
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default LivestreamPublicSection;
