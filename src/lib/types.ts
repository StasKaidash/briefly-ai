/**
 * Shape of a row in `public.briefs`. Mirrors `supabase/migrations/0001_init.sql`.
 * Do not import from generated Supabase types here — those land later (step 11+).
 */
export type BriefStatus = "pending" | "ready" | "failed";

export type Brief = {
  id: string;
  user_id: string;
  url: string;
  title: string;
  byline: string | null;
  tldr: string;
  key_points: string[];
  tags: string[];
  reading_time_min: number | null;
  status: BriefStatus;
  error: string | null;
  created_at: string;
};
