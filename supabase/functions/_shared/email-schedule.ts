// When an email is due. Pure functions, unit-tested.
import { NURTURE_STEPS } from "./email-templates/index.ts";

const DAY = 86_400_000;
const START_WITHIN_DAYS = 14;
const MIN_GAP_MS = DAY - 60 * 60 * 1000; // ~a day between emails, allowing for the cron tick

/** The next nurture step to send for a lead, or null. */
export function nextNurtureStep(
  lead: { createdAt: string; sent: Array<{ step: number; sentAt: string }> },
  now: Date = new Date(),
): number | null {
  const age = now.getTime() - new Date(lead.createdAt).getTime();
  const done = new Set(lead.sent.map((s) => s.step));
  const next = NURTURE_STEPS.find((s) => !done.has(s.step));
  if (!next) return null;
  if (age < next.afterDays * DAY) return null;
  // A report two weeks late reads worse than no report.
  if (done.size === 0 && age > START_WITHIN_DAYS * DAY) return null;
  const last = Math.max(0, ...lead.sent.map((s) => new Date(s.sentAt).getTime()));
  if (last && now.getTime() - last < MIN_GAP_MS) return null;
  return next.step;
}

function localParts(now: Date, timeZone: string): { weekday: string; hour: number } {
  const format = (tz: string) =>
    new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = format(timeZone || "UTC");
  } catch {
    parts = format("UTC");
  }
  return {
    weekday: parts.find((p) => p.type === "weekday")?.value ?? "",
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
  };
}

/** Tuesday 09:00 local. A window rather than one tick, in case a run is missed. */
export function digestDue(now: Date, timeZone: string): boolean {
  const { weekday, hour } = localParts(now, timeZone);
  return weekday === "Tue" && hour >= 9 && hour < 12;
}

/** Monday (UTC) of the week containing `now`, as YYYY-MM-DD: the digest's week id. */
export function weekStartOf(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
