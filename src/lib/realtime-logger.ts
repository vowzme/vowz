import type { RealtimeChannel } from "@supabase/supabase-js";
import { setRealtimeHealth } from "@/lib/realtime-health";


// Client-side logger for Realtime subscription lifecycle events. Emits a
// structured record to the console and dispatches a `vowz:realtime-error`
// CustomEvent so external error trackers (Sentry, LogRocket, PostHog) can
// attach a listener without us hard-coupling to a specific SDK.
//
// Usage:
//   const channel = supabase.channel(name).on(...).subscribe();
//   watchRealtimeChannel(channel, { channel: name, callback: "r2_storage_usage" });

export interface RealtimeContext {
  channel: string;
  callback: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

export type RealtimeSubscribeStatus =
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED";

interface RealtimeLogRecord {
  type: "realtime";
  status: RealtimeSubscribeStatus | "EXCEPTION";
  channel: string;
  callback: string;
  userId?: string;
  message?: string;
  timestamp: string;
  href: string;
  userAgent: string;
  extra?: Record<string, unknown>;
}

function emit(record: RealtimeLogRecord) {
  // Console — always. `error` for failures so DevTools + monitoring pick it up.
  const isError = record.status !== "SUBSCRIBED" && record.status !== "CLOSED";
  const line = `[realtime:${record.status}] channel=${record.channel} cb=${record.callback}`;
  if (isError) {
    // eslint-disable-next-line no-console
    console.error(line, record);
  } else {
    // eslint-disable-next-line no-console
    console.info(line, record);
  }

  // Custom event — for pluggable external error reporters.
  if (typeof window !== "undefined" && isError) {
    try {
      window.dispatchEvent(
        new CustomEvent("vowz:realtime-error", { detail: record }),
      );
    } catch {
      /* CustomEvent unsupported — swallow */
    }
  }
}

function buildRecord(
  status: RealtimeLogRecord["status"],
  ctx: RealtimeContext,
  message?: string,
): RealtimeLogRecord {
  return {
    type: "realtime",
    status,
    channel: ctx.channel,
    callback: ctx.callback,
    userId: ctx.userId,
    message,
    timestamp: new Date().toISOString(),
    href: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    extra: ctx.extra,
  };
}

/**
 * Instrument an already-created RealtimeChannel by subscribing with a status
 * callback. Realtime is an enhancement: an inability to start a WebSocket
 * must never take down the page or discard the data already on screen.
 */
export function subscribeWithLogging(
  channel: RealtimeChannel,
  ctx: RealtimeContext,
): RealtimeChannel {
  try {
    return channel.subscribe((status, err) => {
      const message =
        err instanceof Error ? err.message : err ? String(err) : undefined;
      emit(buildRecord(status as RealtimeSubscribeStatus, ctx, message));
    });
  } catch (err) {
    emit(
      buildRecord(
        "EXCEPTION",
        ctx,
        err instanceof Error ? err.message : String(err),
      ),
    );
    // A synchronous subscribe failure can happen while a mobile browser is
    // resuming or replacing a stale socket. The Realtime client will recover
    // when connectivity returns; do not let this escape a React effect and
    // trip the application-level error boundary.
    return channel;
  }
}
