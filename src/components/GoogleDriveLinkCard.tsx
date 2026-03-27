import { useState } from "react";
import { motion } from "framer-motion";
import { HardDrive, Check, ExternalLink, Unlink, Loader2, ShieldCheck, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { toast } from "@/hooks/use-toast";

interface GoogleDriveLinkCardProps {
  compact?: boolean;
  onLinked?: () => void;
}

const GoogleDriveLinkCard = ({ compact = false, onLinked }: GoogleDriveLinkCardProps) => {
  const { linked, email, loading, startLinking, unlinkDrive } = useGoogleDrive();
  const [unlinking, setUnlinking] = useState(false);

  const handleLink = async () => {
    try {
      await startLinking();
    } catch {
      toast({ title: "Failed to start Google Drive linking", variant: "destructive" });
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await unlinkDrive();
      toast({ title: "Google Drive unlinked" });
    } catch {
      toast({ title: "Failed to unlink", variant: "destructive" });
    } finally {
      setUnlinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl border border-border bg-card">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-body">Checking storage link...</span>
      </div>
    );
  }

  if (linked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800 ${compact ? "p-3" : "p-5"}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body font-semibold text-foreground text-sm">Google Drive Connected</p>
            <p className="font-body text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnlink}
            disabled={unlinking}
            className="text-muted-foreground hover:text-destructive text-xs"
          >
            {unlinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
          </Button>
        </div>
        {!compact && (
          <p className="mt-2 text-xs text-muted-foreground font-body flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Your photos & videos are safely stored in your own Google Drive
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 ${compact ? "p-4" : "p-6"}`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg">
          <Cloud className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="font-display font-bold text-foreground text-base">Link Your Google Drive</h3>
          <p className="font-body text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Store your wedding photos & videos in your own Google Drive — safe, private, and forever yours.
            We never store your media on our servers.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button variant="gold" size="lg" className="w-full font-body" onClick={handleLink}>
            <HardDrive className="w-4 h-4 mr-2" />
            Connect Google Drive
          </Button>
          <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground">
            <ShieldCheck className="w-3 h-3" />
            <span>We only access a dedicated "Vowz" folder</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GoogleDriveLinkCard;
