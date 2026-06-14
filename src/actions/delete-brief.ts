"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type DeleteResult = { ok: false; error: string };

/**
 * Delete a brief and redirect to the dashboard.
 *
 * Success path: calls `redirect()` which throws `NEXT_REDIRECT` — Next.js
 * intercepts that on the server, sends the redirect back to the client, and
 * the function "never returns" from the caller's perspective. The `void` in
 * the return type covers exactly that case so TS stops complaining; the
 * caller should not rely on a `void` resolution path.
 *
 * Failure path: returns `{ ok: false, error }` so the client can toast it.
 *
 * RLS rejects deletes on rows the user doesn't own, so explicit ownership
 * filtering isn't needed here.
 */
export async function deleteBriefAction(
  briefId: string,
): Promise<DeleteResult | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("briefs").delete().eq("id", briefId);
  if (error) {
    logger.error("deleteBrief", "failed", { briefId, message: error.message });
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
