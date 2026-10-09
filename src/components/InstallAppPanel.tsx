import { useEffect, useRef, useState } from "react";
import { Download, Share, PlusSquare, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { canPromptInstall, isIOS, isStandalone, promptInstall, subscribeInstall, waitForInstalled } from "@/lib/pwa-install";

type Phase = "idle" | "installing" | "done" | "dismissed";

/** Install button with a progress bar while the phone adds the app. */
export default function InstallAppPanel({ compact = false }: { compact?: boolean }) {
  const [, force] = useState(0);
  const [phase, setPhase] = useState<Phase>(isStandalone() ? "done" : "idle");
  const [pct, setPct] = useState(0);
  const timer = useRef<number>();
  useEffect(() => subscribeInstall(() => force((n) => n + 1)), []);
  useEffect(() => () => window.clearInterval(timer.current), []);

  const start = async () => {
    const ok = await promptInstall();
    if (!ok) { setPhase("dismissed"); return; }
    setPhase("installing"); setPct(5);
    timer.current = window.setInterval(() => setPct((p) => (p < 92 ? p + Math.max(1, (92 - p) / 8) : p)), 200);
    await waitForInstalled(12000);
    window.clearInterval(timer.current);
    setPct(100);
    setTimeout(() => setPhase("done"), 400);
  };

  if (phase === "done") {
    return <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-5 w-5 text-accent" />Vowz is installed. Open it from your home screen.</div>;
  }
  if (phase === "installing") {
    return (
      <div className="space-y-2 w-full">
        <div className="flex justify-between text-sm"><span>Installing Vowz…</span><span>{Math.round(pct)}%</span></div>
        <Progress value={pct} aria-label="Installation progress" />
      </div>
    );
  }
  if (canPromptInstall()) {
    return (
      <div className="space-y-2">
        <Button onClick={start} size={compact ? "sm" : "lg"}><Download className="h-4 w-4 mr-2" />Install the Vowz app</Button>
        {phase === "dismissed" && <p className="text-xs text-muted-foreground">No problem — you can install any time from here.</p>}
      </div>
    );
  }
  if (isIOS()) {
    return (
      <ol className="text-sm space-y-2">
        <li className="flex gap-2 items-center"><Share className="h-4 w-4 text-accent" />1. Tap the Share button in Safari</li>
        <li className="flex gap-2 items-center"><PlusSquare className="h-4 w-4 text-accent" />2. Choose “Add to Home Screen”</li>
        <li className="flex gap-2 items-center"><Smartphone className="h-4 w-4 text-accent" />3. Tap Add — Vowz appears with your apps</li>
      </ol>
    );
  }
  return <p className="text-sm text-muted-foreground">Open vowz.me in Chrome or Edge, then use the browser menu → “Install app” or “Add to Home screen”.</p>;
}
