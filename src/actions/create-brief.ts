"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { summarize, SummarizeError } from "@/lib/anthropic";
import { extractArticle, ExtractError } from "@/lib/extract";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// `z.string().url()` accepts any valid URL including `javascript:` and `data:`
// — those would later flow into an `<a href>` on the detail page and become
// an XSS vector. Restrict to http(s) explicitly.
const urlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((u) => /^https?:\/\//i.test(u), "URL must start with http:// or https://");

export type CreateBriefState =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | null;

/**
 * Two-phase brief creation:
 *
 *  1. INSERT a row with status='pending' so the dashboard immediately shows a
 *     skeleton card after revalidate.
 *  2. Schedule the slow extract + summarize work via `after()`, so the response
 *     is sent before the work starts. The Supabase Realtime subscription in
 *     `BriefsRealtime` picks up the eventual UPDATE and refreshes the UI.
 */
export async function createBriefAction(
  _prevState: CreateBriefState,
  formData: FormData,
): Promise<CreateBriefState> {
  const parsed = urlSchema.safeParse(formData.get("url"));
  if (!parsed.success) {
    return { ok: false, error: "Please paste a valid URL." };
  }
  const url = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: row, error: insertError } = await supabase
    .from("briefs")
    .insert({
      user_id: user.id,
      url,
      title: "Processing…",
      tldr: "",
      key_points: [],
      tags: [],
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !row) {
    return {
      ok: false,
      error: insertError?.message ?? "Could not save the brief.",
    };
  }

  const briefId = row.id as string;

  after(async () => {
    await processBrief(briefId, url);
  });

  revalidatePath("/dashboard");
  return { ok: true, id: briefId };
}

/**
 * Background phase: fetch the article, summarize, and update the row.
 * Runs inside `after()` so the form response isn't blocked. Errors are written
 * back to the row as status='failed' instead of throwing — the user sees a
 * failed card rather than a stuck skeleton.
 */
async function processBrief(id: string, url: string): Promise<void> {
  const t0 = Date.now();
  logger.info("processBrief", "start", { id, url });

  const supabase = await createClient();

  try {
    const article = await extractArticle(url);
    logger.info("processBrief", "extracted", {
      id,
      titleLen: article.title.length,
      contentLen: article.content.length,
    });

    const brief = await summarize({
      title: article.title,
      content: article.content,
    });
    logger.info("processBrief", "summarized", {
      id,
      ms: Date.now() - t0,
    });

    const { error } = await supabase
      .from("briefs")
      .update({
        title: article.title,
        byline: article.byline,
        tldr: brief.tldr,
        key_points: brief.key_points,
        tags: brief.tags,
        reading_time_min: brief.reading_time_min,
        status: "ready",
        error: null,
      })
      .eq("id", id);
    if (error) throw error;
    logger.info("processBrief", "done", { id, ms: Date.now() - t0 });
  } catch (err: unknown) {
    const message =
      err instanceof ExtractError || err instanceof SummarizeError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);

    logger.error("processBrief", "failed", { id, ms: Date.now() - t0, message });

    const { error: updateError } = await supabase
      .from("briefs")
      .update({
        status: "failed",
        error: message,
        title: "Could not be retrieved",
      })
      .eq("id", id);

    if (updateError) {
      logger.error("processBrief", "could not mark row failed", {
        id,
        updateError: updateError.message,
      });
    }
  }

  revalidatePath("/dashboard");
}
