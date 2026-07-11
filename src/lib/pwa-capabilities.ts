// Detects which PWA capabilities the current browser/device supports so the UI
// can degrade gracefully when Widgets, Push, Background Sync, etc. are missing.

export type Capability =
  | "countdown"
  | "pushNotifications"
  | "backgroundSync"
  | "periodicSync"
  | "offlineFallback"
  | "tabbedDisplay"
  | "windowControlsOverlay";

export type CapabilitySupport = Record<Capability, boolean>;

function hasWindow() {
  return typeof window !== "undefined";
}

function displayModeMatches(mode: string) {
  if (!hasWindow() || !window.matchMedia) return false;
  try {
    return window.matchMedia(`(display-mode: ${mode})`).matches;
  } catch {
    return false;
  }
}

export function detectCapabilities(): CapabilitySupport {
  if (!hasWindow()) {
    return {
      countdown: false,
      pushNotifications: false,
      backgroundSync: false,
      periodicSync: false,
      offlineFallback: false,
      tabbedDisplay: false,
      windowControlsOverlay: false,
    };
  }

  const swSupported = "serviceWorker" in navigator;
  // Widgets Board is Windows 11 + Chromium only; feature-detect via UA hints
  // because the Widgets API itself only exists inside the SW context.
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  const isWindows = uaData?.platform === "Windows" || /Windows/i.test(navigator.userAgent);
  const isChromium = "chrome" in window || /Chrome|Edg/i.test(navigator.userAgent);

  return {
    countdown: swSupported && isWindows && isChromium,
    pushNotifications: swSupported && "PushManager" in window && "Notification" in window,
    backgroundSync: swSupported && "SyncManager" in window,
    periodicSync: swSupported && "PeriodicSyncManager" in window,
    offlineFallback: swSupported, // Workbox + offline.html always available on SW-capable UAs
    tabbedDisplay: displayModeMatches("tabbed") || (isChromium && !/Mobile/i.test(navigator.userAgent)),
    windowControlsOverlay: "windowControlsOverlay" in navigator || displayModeMatches("window-controls-overlay"),
  };
}