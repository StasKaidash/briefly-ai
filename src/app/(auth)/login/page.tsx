import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { next, error } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-bold tracking-tight"
          >
            briefly
          </Link>
          <p className="text-muted-foreground text-sm">
            Sign in with a one-time link.
          </p>
        </div>

        {error && (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            We couldn&apos;t verify that link. Try again.
          </div>
        )}

        <LoginForm next={next} />

        <p className="text-muted-foreground text-center text-xs">
          By signing in you agree to receive a one-time email link.
        </p>
      </div>
    </main>
  );
}
