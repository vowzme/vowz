import { useEffect, useRef, useState } from "react";
import { Music, Play, Pause, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  trackUrl: string;
  trackName?: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number; // 0..1
  accent?: string;
  light?: string;
}

/**
 * Floating background music player for published wedding sites.
 * Browsers block autoplay with sound, so we show a subtle prompt until the
 * guest taps play. Once playing, the button becomes a tiny mute/unmute pill.
 */
const BackgroundMusicPlayer = ({
  trackUrl,
  trackName,
  autoplay = true,
  loop = true,
  volume = 0.4,
  accent = "#D4AF37",
  light = "#FFF5E6",
}: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showPrompt, setShowPrompt] = useState(autoplay);

  useEffect(() => {
    const audio = new Audio(trackUrl);
    audio.loop = loop;
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.preload = "auto";
    audioRef.current = audio;

    if (autoplay) {
      audio
        .play()
        .then(() => {
          setPlaying(true);
          setShowPrompt(false);
        })
        .catch(() => {
          // Autoplay blocked — keep prompt visible
          setShowPrompt(true);
        });
    }

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [trackUrl, loop, volume, autoplay]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
      setShowPrompt(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <AnimatePresence>
        {showPrompt && !playing && (
          <motion.button
            key="prompt"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={toggle}
            className="flex items-center gap-2 rounded-full shadow-lg pl-3 pr-4 py-2 backdrop-blur-md"
            style={{ backgroundColor: `${accent}ee`, color: light }}
            aria-label="Play background music"
          >
            <Music className="w-4 h-4" />
            <span className="font-body text-xs font-medium">Tap for music</span>
          </motion.button>
        )}
      </AnimatePresence>

      {!showPrompt && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={toggle}
          className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center backdrop-blur-md hover:scale-110 transition-transform"
          style={{ backgroundColor: `${accent}ee`, color: light }}
          aria-label={playing ? `Pause ${trackName || "background music"}` : "Play background music"}
          title={trackName}
        >
          {playing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Music className="w-4 h-4" />
            </motion.div>
          ) : (
            <Play className="w-4 h-4" fill="currentColor" />
          )}
        </motion.button>
      )}
    </div>
  );
};

export default BackgroundMusicPlayer;
