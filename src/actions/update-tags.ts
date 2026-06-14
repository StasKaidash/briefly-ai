"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { MAX_TAGS, normalizeTag, TAG_RE } from "@/lib/tags";

export type TagResult =
  | { ok: true; tags: string[] }
  | { ok: false; error: string };

/**
 * Add a tag to a brief. RLS scopes the row to the signed-in user automatically,
 * so we don't need an explicit `eq("user_id", …)` filter — Postgres rejects
 * cross-user writes at the policy layer.
 *
 * Validation mirrors what BriefTagsEditor does client-side; we re-check here
 * because a determined caller could bypass the UI.
 *
 * Note: dedup/length checks here are best-effort, not atomic — two concurrent
 * adds can both pass the read and one overwrite the other. For a personal
 * dashboard the risk is negligible; if it ever matters, move the mutation to
 * SQL using `array_append` + a `CHECK (array_length(tags,1) <= 8)` constraint.
 */
export async function addTagAction(
  briefId: string,
  raw: string,
): Promise<TagResult> {
  const tag = normalizeTag(raw);
  if (!TAG_RE.test(tag)) {
    return {
      ok: false,
      error: "Tags can use a–z, 0–9, and dashes only (max 32 chars).",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: row, error: readError } = await supabase
    .from("briefs")
    .select("tags")
    .eq("id", briefId)
    .single();
  if (readError || !row) return { ok: false, error: "Brief not found." };

  const current: string[] = row.tags ?? [];
  if (current.includes(tag)) return { ok: true, tags: current };
  if (current.length >= MAX_TAGS) {
    return { ok: false, error: `Max ${MAX_TAGS} tags per brief.` };
  }

  const next = [...current, tag];
  const { error: updateError } = await supabase
    .from("briefs")
    .update({ tags: next })
    .eq("id", briefId);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/dashboard");
  return { ok: true, tags: next };
}

export async function removeTagAction(
  briefId: string,
  tag: string,
): Promise<TagResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: row, error: readError } = await supabase
    .from("briefs")
    .select("tags")
    .eq("id", briefId)
    .single();
  if (readError || !row) return { ok: false, error: "Brief not found." };

  const current: string[] = row.tags ?? [];
  const next = current.filter((t) => t !== tag);
  if (next.length === current.length) return { ok: true, tags: current };

  const { error: updateError } = await supabase
    .from("briefs")
    .update({ tags: next })
    .eq("id", briefId);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/dashboard");
  return { ok: true, tags: next };
}
