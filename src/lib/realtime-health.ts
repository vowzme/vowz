import { useEffect, useState } from "react";

/**
 * Tracks whether the Realtime (live update) stream is currently usable.
 * Realtime is only an enhancement: when it degrades, screens fall back to
 * polling instead of showing an error. Nothing here ever throws.
 */

export type RealtimeHealth = "connecting" | "live" | "degraded";

let health: RealtimeHealth = "connecting";
const listeners = new Set<(h: RealtimeHealth) => void>();

export function getRealtimeHealth(): RealtimeHealth {
  return health;
}

export function setRealtimeHealth(next: RealtimeHealth) {
  if (next === health) return;
  health = next;
  listeners.forEach((l) => {
    try {
      l(health);
    } catch {
      /* listener errors must never propagate */
    }
  });
}

export function subscribeRealtimeHealth(cb: (h: RealtimeHealth) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useRealtimeHealth(): RealtimeHealth {
  const [value, setValue] = useState<RealtimeHealth>(getRealtimeHealth);
  useEffect(() => {
    const unsubscribe = subscribeRealtimeHealth(setValue);
    return () => {
      unsubscribe();
    };
  }, []);

  return value;
}

/** True when live updates are not flowing and callers should poll instead. */
export function useShouldPollFallback(): boolean {
  return useRealtimeHealth() === "degraded";
}
