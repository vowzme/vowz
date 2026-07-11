import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { detectCapabilities, type Capability } from "@/lib/pwa-capabilities";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

const STORAGE_KEY = "vowz.pwa.widgets.prefs";

type WidgetKey = Capability;
type Prefs = Record<WidgetKey, boolean>;

const DEFAULTS: Prefs = {
  countdown: true,
  pushNotifications: true,
  backgroundSync: true,
  periodicSync: true,
  offlineFallback: true,
  tabbedDisplay: false,
  windowControlsOverlay: false,
};

const ROWS: { key: WidgetKey; title: string; description: string }[] = [
  { key: "countdown", title: "Wedding Countdown Widget", description: "Show the days-until-the-big-day widget on supported devices (Windows Widgets Board)." },
  { key: "pushNotifications", title: "Push Notifications", description: "Allow the app to send RSVP and reminder notifications when installed." },
  { key: "backgroundSync", title: "Background Sync", description: "Retry failed edits (RSVPs, blessings) automatically when the connection returns." },
  { key: "periodicSync", title: "Periodic Refresh", description: "Silently refresh the offline shell so your site stays up to date." },
  { key: "offlineFallback", title: "Offline Fallback", description: "Show a branded Vowz page instead of a browser error when the network is down." },
  { key: "tabbedDisplay", title: "Tabbed Display", description: "Open multiple wedding sites in tabs inside the installed app (Chromium desktop only)." },
  { key: "windowControlsOverlay", title: "Window Controls Overlay", description: "Blend the title bar into the app for a native desktop feel." },
];

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) } as Prefs;
  } catch {
    return DEFAULTS;
  }
}

export default function WidgetSettings() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [support, setSupport] = useState(() => detectCapabilities());

  useEffect(() => {
    setPrefs(loadPrefs());
    setSupport(detectCapabilities());
  }, []);

  const unsupportedCount = (Object.keys(support) as Capability[]).filter((k) => !support[k]).length;

  const update = (key: WidgetKey, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("vowz:widget-prefs-changed", { detail: next }));
    } catch {
      /* ignore */
    }
  };

  const requestPush = async () => {
    try {
      if (!("Notification" in window)) throw new Error("Notifications unsupported");
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        toast({ title: "Notifications enabled" });
      } else {
        toast({ title: "Notifications blocked", description: "Enable them from your browser settings.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Not supported", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Link>
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif">App Widgets & Capabilities</h1>
            <p className="text-sm text-muted-foreground">Turn installed-app features on or off. Changes apply the next time the app loads.</p>
          </div>
        </div>

      {unsupportedCount > 0 && (
          <div className="mb-4 flex items-start gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-foreground">Some features aren't available on this device</div>
              <div className="text-muted-foreground mt-1">
                Vowz falls back to the standard web experience — RSVPs, invitations and your public site keep working exactly the same. Unsupported toggles are disabled below.
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Widget features</CardTitle>
            <CardDescription>Configure the PWA widgets and background capabilities exposed by Vowz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {ROWS.map((row) => (
              <div key={row.key} className={`flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0 ${!support[row.key] ? "opacity-60" : ""}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label htmlFor={row.key} className="text-base font-medium">{row.title}</Label>
                    {!support[row.key] && (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Not supported</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{row.description}</p>
                  {row.key === "pushNotifications" && prefs.pushNotifications && support.pushNotifications && (
                    <Button size="sm" variant="outline" className="mt-2" onClick={requestPush}>
                      Grant browser permission
                    </Button>
                  )}
                </div>
                <Switch
                  id={row.key}
                  checked={prefs[row.key] && support[row.key]}
                  disabled={!support[row.key]}
                  onCheckedChange={(v) => update(row.key, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-6">
          Availability depends on your device and browser. Some capabilities (Tabbed Display, Window Controls Overlay, Widgets Board) currently work only on Chromium-based desktops or Windows 11.
        </p>
      </div>
    </div>
  );
}