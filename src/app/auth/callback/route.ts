import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase magic-link callback. The link in the user's email lands here with
 * `?code=...`; we exchange it for a session cookie and bounce to the
 * destination (defaults to /dashboard).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const safeNext = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
