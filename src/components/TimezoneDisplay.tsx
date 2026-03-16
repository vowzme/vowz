import { useState, useEffect } from "react";
import { Clock, Globe } from "lucide-react";

function getViewerTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function parseEventDateTime(dateStr: string, timeStr: string, eventTz?: string): Date | null {
  if (!dateStr) return null;
  try {
    // Try to parse date string
    let parsed: Date;
    const combined = timeStr ? `${dateStr} ${timeStr}` : dateStr;
    parsed = new Date(combined);
    if (isNaN(parsed.getTime())) {
      // Try more flexible parsing
      parsed = new Date(dateStr);
    }
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

function formatTimeInZone(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

function formatDateInZone(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

interface TimezoneDisplayProps {
  date: string;
  time: string;
  eventTimezone?: string;
  accent: string;
}

export function TimezoneDisplay({ date, time, eventTimezone, accent }: TimezoneDisplayProps) {
  const viewerTz = getViewerTimezone();
  const parsed = parseEventDateTime(date, time, eventTimezone);

  if (!parsed || !time) return null;

  const eventTz = eventTimezone || viewerTz;
  const isDifferentTz = eventTz !== viewerTz;

  if (!isDifferentTz) return null;

  const localTime = formatTimeInZone(parsed, viewerTz);

  return (
    <div className="flex items-center gap-1 text-xs font-body mt-1" style={{ color: `${accent}cc` }}>
      <Globe className="w-3 h-3" />
      <span>{localTime} your time</span>
    </div>
  );
}

export function TimezoneNotice({ accent }: { accent: string }) {
  const tz = getViewerTimezone();
  const shortTz = tz.split("/").pop()?.replace(/_/g, " ") || tz;

  return (
    <div className="flex items-center justify-center gap-1.5 text-xs font-body text-muted-foreground mb-4">
      <Clock className="w-3.5 h-3.5" />
      <span>Times shown in your local time zone: {shortTz}</span>
    </div>
  );
}

export default TimezoneDisplay;
