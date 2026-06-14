"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Signs the current user out of Supabase and bounces them back to /login.
 * Called from a `<form action={logoutAction}>` so it works without JS.
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
