import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Browser-side Supabase client. Safe to call from client components.
 * Uses the public anon key; never expose the service-role key here.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
