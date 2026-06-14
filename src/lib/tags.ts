/**
 * Shared tag rules — single source of truth for client + server validation.
 *
 * Keep in sync with the array column definition in `0001_init.sql` (no length
 * constraint there, so this is a soft cap the UI and server actions enforce).
 */
export const TAG_RE = /^[a-z0-9-]{1,32}$/;
export const MAX_TAGS = 8;

export function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/^#/, "");
}
