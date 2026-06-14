"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to live row changes in `public.briefs` for the current user and
 * calls `router.refresh()` on any change so the server component re-fetches
 * and the dashboard re-renders.
 *
 * Cleanup on unmount removes the channel — without it, every navigation
 * leaves a dangling subscription. Supabase has a soft channel cap per
 * connection (100 by default) and the WebSocket holds the tab's resources,
 * so leaks add up fast in long sessions.
 */
export function BriefsRealtime({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`briefs:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "briefs",
          filter: `user_id=eq.${userId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
