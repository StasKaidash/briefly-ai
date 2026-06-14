import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

/**
 * Server-side Supabase client. Pulls and writes cookies via `next/headers`.
 *
 * Cookie writes from RSC are tolerated (try/catch swallow) because Next.js
 * forbids them outside Server Actions / Route Handlers. The proxy
 * (src/proxy.ts) is the source of truth for refreshing sessions on every
 * navigation, so RSC reads can safely skip writing.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — safe to ignore because the proxy
            // refreshes the session on every navigation.
          }
        },
      },
    },
  );
}
