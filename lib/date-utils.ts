// lib/date-utils.ts
// Centralized date helpers – Monday-first week (Vietnamese convention).

/** Return a new Date set to midnight (00:00:00.000) of the Monday of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, … 6=Sat
  const offset = day === 0 ? 6 : day - 1; // days since Monday
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Return a new Date set to midnight of the Sunday ending the week containing `date`. */
export function getWeekEnd(date: Date): Date {
  const monday = getWeekStart(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/** Vietnamese two-letter weekday label: T2 (Mon) → CN (Sun). */
export const VIETNAMESE_DAY_LABELS: readonly string[] = [
  "CN", // Sunday  (getDay() === 0)
  "T2", // Monday
  "T3", // Tuesday
  "T4", // Wednesday
  "T5", // Thursday
  "T6", // Friday
  "T7", // Saturday
];

export function getDayLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return VIETNAMESE_DAY_LABELS[d.getDay()];
}

/**
 * Generate exactly 7 entries for the current week (Mon → Sun).
 * Each entry has the ISO date string ("YYYY-MM-DD") and the Vietnamese label.
 * Dates after today have `null` values so callers can decide how to display them.
 */
export function getDaysOfWeek(
  weekReference: Date = new Date()
): { date: string; label: string; dayOfWeek: number }[] {
  const monday = getWeekStart(weekReference);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: toISODate(d),
      label: VIETNAMESE_DAY_LABELS[d.getDay()],
      dayOfWeek: d.getDay(),
    };
  });
}

/** Format a Date to "YYYY-MM-DD" in local time (no timezone shift). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Format a Date to "DD/MM" for short chart labels. */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Check whether two dates fall in the same Monday→Sunday week. */
export function isSameWeek(a: Date, b: Date): boolean {
  return toISODate(getWeekStart(a)) === toISODate(getWeekStart(b));
}
