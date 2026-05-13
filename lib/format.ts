/**
 * Format a value returned from pg (which may be a Date object or an ISO string)
 * to a human-readable Thai date string.
 *
 * @param value - Date | string | null | undefined
 * @param opts  - Intl.DateTimeFormatOptions (default: short date)
 */
export function fmtDate(
  value: Date | string | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (value == null) return "-";
  const d = value instanceof Date ? value : new Date(value as string);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("th-TH", opts ?? { dateStyle: "short" });
}

/**
 * Format a pg timestamp/date as a full Thai date (long style).
 */
export function fmtDateLong(value: Date | string | null | undefined): string {
  return fmtDate(value, { dateStyle: "long" });
}

/**
 * Format a pg timestamp to date + time.
 */
export function fmtDateTime(value: Date | string | null | undefined): string {
  if (value == null) return "-";
  const d = value instanceof Date ? value : new Date(value as string);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Safely convert anything that pg may return (Date or string) to a plain string
 * for use as a React child or value attribute.
 */
export function toStr(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
