// Calendar invite helpers for wedding events.
// Builds Google Calendar template URLs and downloadable .ics files
// from the free-form event.date / event.time strings the editor stores.

export interface CalendarEvent {
  name: string;
  date?: string;
  time?: string;
  venue?: string;
  address?: string;
  location?: string;
  locationLink?: string;
  timezone?: string;
  description?: string;
}

const DEFAULT_DURATION_MINUTES = 120;

/** Parse event.date + event.time into a Date, or null if unparseable. */
export function parseEventStart(date?: string, time?: string): Date | null {
  if (!date) return null;
  const trimmed = date.trim();
  const tryStrings = [
    time ? `${trimmed} ${time.trim()}` : "",
    trimmed,
  ].filter(Boolean);
  for (const s of tryStrings) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function toGoogleDate(d: Date): string {
  // YYYYMMDDTHHMMSSZ (UTC)
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function toIcsDate(d: Date): string {
  return toGoogleDate(d);
}

function combineLocation(event: CalendarEvent): string {
  return [event.venue, event.address, event.location].filter(Boolean).join(", ");
}

function buildDescription(event: CalendarEvent): string {
  const parts = [event.description || ""];
  if (event.locationLink) parts.push(`Map: ${event.locationLink}`);
  return parts.filter(Boolean).join("\n\n");
}

/** Google Calendar "Add event" URL. Returns null if the event lacks a parseable date. */
export function buildGoogleCalendarUrl(event: CalendarEvent): string | null {
  const start = parseEventStart(event.date, event.time);
  if (!start) return null;
  const end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name || "Wedding Event",
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
    details: buildDescription(event),
    location: combineLocation(event),
  });
  if (event.timezone) params.set("ctz", event.timezone);
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/** Outlook Live "Add event" deep link. Returns null if unparseable. */
export function buildOutlookCalendarUrl(event: CalendarEvent): string | null {
  const start = parseEventStart(event.date, event.time);
  if (!start) return null;
  const end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.name || "Wedding Event",
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: buildDescription(event),
    location: combineLocation(event),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Build an .ics document body for one event. Returns null if unparseable. */
export function buildIcsFile(event: CalendarEvent): string | null {
  const start = parseEventStart(event.date, event.time);
  if (!start) return null;
  const end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  const uid = `${(event.name || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${start.getTime()}@vowz.me`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vowz//Wedding Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(event.name || "Wedding Event")}`,
    `DESCRIPTION:${escapeIcs(buildDescription(event))}`,
    `LOCATION:${escapeIcs(combineLocation(event))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

/** Trigger a browser download of an .ics file for the given event. */
export function downloadIcs(event: CalendarEvent): boolean {
  const ics = buildIcsFile(event);
  if (!ics) return false;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(event.name || "wedding-event").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/** Build a combined .ics file with every dated event as a separate VEVENT. */
export function buildAllEventsIcs(events: CalendarEvent[]): string | null {
  const dated = events
    .map((e) => ({ event: e, start: parseEventStart(e.date, e.time) }))
    .filter((x): x is { event: CalendarEvent; start: Date } => !!x.start);
  if (dated.length === 0) return null;
  const now = toIcsDate(new Date());
  const body = dated.flatMap(({ event, start }) => {
    const end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
    const uid = `${(event.name || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${start.getTime()}@vowz.me`;
    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${escapeIcs(event.name || "Wedding Event")}`,
      `DESCRIPTION:${escapeIcs(buildDescription(event))}`,
      `LOCATION:${escapeIcs(combineLocation(event))}`,
      "END:VEVENT",
    ];
  });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vowz//Wedding Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...body,
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Trigger a download of a combined .ics containing all dated events. */
export function downloadAllEventsIcs(events: CalendarEvent[], coupleNames?: string): boolean {
  const ics = buildAllEventsIcs(events);
  if (!ics) return false;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = (coupleNames || "wedding").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  a.download = `${slug}-events.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}