import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns the host without `www.`, or the original string if the URL is malformed. */
export function hostFromUrl(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const ABSOLUTE = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

/** "5m ago" / "yesterday" within a week, otherwise a short absolute date. */
export function formatRelativeDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const diffHour = Math.round(diffMs / 3_600_000);
  const diffDay = Math.round(diffMs / 86_400_000);

  if (Math.abs(diffMin) < 60) return RELATIVE.format(diffMin, "minute");
  if (Math.abs(diffHour) < 24) return RELATIVE.format(diffHour, "hour");
  if (Math.abs(diffDay) < 7) return RELATIVE.format(diffDay, "day");
  return ABSOLUTE.format(date);
}
