"use server";

import { revalidatePath } from "next/cache";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type DeleteAllResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

/**
 * Wipe every brief belonging to the current user.
 *
 * RLS already scopes the delete to `auth.uid() = user_id`, but we pin the
 * filter explicitly anyway: defense in depth, and it makes the SQL log line
 * obvious if anyone ever audits it.
 *
 * The caller (a client component with a "type your email to confirm" step)
 * is responsible for the destructive-action friction — this action just runs.
 */
export async function deleteAllBriefsAction(): Promise<DeleteAllResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error, count } = await supabase
    .from("briefs")
    .delete({ count: "exact" })
    .eq("user_id", user.id);

  if (error) {
    logger.error("deleteAllBriefs", "failed", {
      userId: user.id,
      message: error.message,
    });
    return { ok: false, error: error.message };
  }

  logger.info("deleteAllBriefs", "done", {
    userId: user.id,
    count: count ?? 0,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true, count: count ?? 0 };
}
