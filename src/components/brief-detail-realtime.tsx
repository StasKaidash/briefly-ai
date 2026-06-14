"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Realtime subscription scoped to a single brief row. Mounted on the detail
 * page regardless of status — covers pending → ready transitions, tag edits
 * from another tab, and DELETE (which triggers a refresh → notFound()).
 *
 * Same cleanup discipline as BriefsRealtime: remove the channel on unmount so
 * navigating away doesn't leak WebSocket subscriptions.
 */
export function BriefDetailRealtime({ briefId }: { briefId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`brief:${briefId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "briefs",
          filter: `id=eq.${briefId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [briefId, router]);

  return null;
}
